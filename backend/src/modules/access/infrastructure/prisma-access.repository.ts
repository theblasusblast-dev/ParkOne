import type { PrismaClient } from '@prisma/client';
import { AppError } from '../../../shared/app-error';
import type { Band } from '../../../shared/domain/band';
import type { VehicleType } from '../../../shared/domain/vehicle-type';
import type { Charge } from '../../billing/domain/charge';
import type { AccessEventData, AccessRepository, NewCharge, Occupancy, SiteSchedule, SpotRef } from '../application/ports';

const CHARGE_FIELDS = { id: true, plate: true, operatingDay: true, band: true, amountCop: true, status: true } as const;

/** La base de datos guarda el día operativo como fecha; el dominio lo usa como texto AAAA-MM-DD. */
const toDbDate = (day: string) => new Date(`${day}T00:00:00.000Z`);

function toCharge(row: { id: string; plate: string; operatingDay: Date; band: Band; amountCop: number; status: Charge['status'] }): Charge {
  return { ...row, operatingDay: row.operatingDay.toISOString().slice(0, 10) };
}

/** Adaptador de persistencia del carril con Prisma. */
export class PrismaAccessRepository implements AccessRepository {
  constructor(private readonly db: PrismaClient) {}

  findSchedule(siteId: string): Promise<SiteSchedule | null> {
    return this.db.site.findUnique({ where: { id: siteId }, select: { dayBandStart: true, nightBandStart: true } });
  }

  async findOccupancy(siteId: string, plate: string): Promise<Occupancy | null> {
    const spot = await this.db.parkingSpot.findFirst({
      where: { siteId, currentPlate: plate },
      select: { id: true, code: true, vehicleType: true, occupiedSince: true },
    });
    if (!spot) return null;
    return {
      spot: { id: spot.id, code: spot.code },
      vehicleType: spot.vehicleType,
      since: spot.occupiedSince ?? new Date(),
    };
  }

  findFreeSpot(siteId: string, vehicleType: VehicleType): Promise<SpotRef | null> {
    return this.db.parkingSpot.findFirst({
      where: { siteId, vehicleType, status: 'FREE' },
      orderBy: { code: 'asc' },
      select: { id: true, code: true },
    });
  }

  async findCharge(siteId: string, plate: string, operatingDay: string): Promise<Charge | null> {
    const row = await this.db.charge.findUnique({
      where: { plate_siteId_operatingDay: { plate, siteId, operatingDay: toDbDate(operatingDay) } },
      select: CHARGE_FIELDS,
    });
    return row ? toCharge(row) : null;
  }

  findCurrentRate(siteId: string, vehicleType: VehicleType, band: Band) {
    return this.db.rate.findFirst({
      where: { siteId, vehicleType, band, validTo: null },
      select: { id: true, amountCop: true },
    });
  }

  async admit(spotId: string, event: AccessEventData, newCharge: NewCharge | null) {
    return this.db.$transaction(async (tx) => {
      // Solo ocupa el espacio si sigue libre: si otro vehículo lo tomó un instante antes, no se pisa.
      const taken = await tx.parkingSpot.updateMany({
        where: { id: spotId, status: 'FREE' },
        data: { status: 'OCCUPIED', currentPlate: event.plate, occupiedSince: event.occurredAt },
      });
      if (taken.count === 0) {
        throw new AppError(409, 'SPOT_TAKEN', 'El espacio asignado acaba de ocuparse. Intente de nuevo.');
      }

      const charge = newCharge
        ? toCharge(
            await tx.charge.create({
              data: {
                siteId: event.siteId,
                plate: event.plate,
                vehicleType: event.vehicleType,
                operatingDay: toDbDate(newCharge.operatingDay),
                band: newCharge.band,
                rateId: newCharge.rateId,
                amountCop: newCharge.amountCop,
              },
              select: CHARGE_FIELDS,
            }),
          )
        : null;

      const created = await tx.accessEvent.create({ data: event, select: { id: true } });
      return { eventId: created.id, charge };
    });
  }

  async recordEvent(event: AccessEventData): Promise<string> {
    return (await this.db.accessEvent.create({ data: event, select: { id: true } })).id;
  }

  async findPendingCharges(siteId: string, plate: string): Promise<Charge[]> {
    const rows = await this.db.charge.findMany({
      where: { siteId, plate, status: 'PENDING' },
      orderBy: { operatingDay: 'asc' },
      select: CHARGE_FIELDS,
    });
    return rows.map(toCharge);
  }

  async createCharge(siteId: string, plate: string, vehicleType: VehicleType, charge: NewCharge): Promise<Charge> {
    const row = await this.db.charge.create({
      data: { siteId, plate, vehicleType, ...charge, operatingDay: toDbDate(charge.operatingDay) },
      select: CHARGE_FIELDS,
    });
    return toCharge(row);
  }

  release(spotId: string, event: AccessEventData): Promise<string> {
    return this.db.$transaction(async (tx) => {
      await tx.parkingSpot.update({
        where: { id: spotId },
        data: { status: 'FREE', currentPlate: null, occupiedSince: null },
      });
      return (await tx.accessEvent.create({ data: event, select: { id: true } })).id;
    });
  }
}
