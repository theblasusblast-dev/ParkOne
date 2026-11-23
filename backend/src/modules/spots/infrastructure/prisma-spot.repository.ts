import type { PrismaClient } from '@prisma/client';
import type { SpotStatus } from '../../../shared/domain/spot-status';
import type { SpotFilter, SpotRepository } from '../application/ports';
import type { SpotView } from '../domain/spot';

/** Adaptador de persistencia de espacios con Prisma. */
export class PrismaSpotRepository implements SpotRepository {
  constructor(private readonly db: PrismaClient) {}

  async siteExists(siteId: string): Promise<boolean> {
    return (await this.db.site.findUnique({ where: { id: siteId }, select: { id: true } })) !== null;
  }

  async listMap(siteId: string, filter: SpotFilter): Promise<SpotView[]> {
    const spots = await this.db.parkingSpot.findMany({
      where: {
        siteId,
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.vehicleType ? { vehicleType: filter.vehicleType } : {}),
        ...(filter.plate ? { currentPlate: { contains: filter.plate, mode: 'insensitive' as const } } : {}),
      },
      orderBy: [{ vehicleType: 'asc' }, { code: 'asc' }],
    });

    // Último cobro de cada placa que está adentro, para el detalle al pasar el mouse.
    const plates = spots.flatMap((spot) => (spot.currentPlate ? [spot.currentPlate] : []));
    const charges = plates.length
      ? await this.db.charge.findMany({
          where: { siteId, plate: { in: plates } },
          orderBy: { createdAt: 'desc' },
          select: { plate: true, amountCop: true, band: true, status: true },
        })
      : [];

    return spots.map((spot) => {
      const charge = charges.find((candidate) => candidate.plate === spot.currentPlate) ?? null;
      return {
        id: spot.id,
        code: spot.code,
        vehicleType: spot.vehicleType,
        status: spot.status,
        disabledReason: spot.disabledReason,
        occupant:
          spot.currentPlate && spot.occupiedSince
            ? {
                plate: spot.currentPlate,
                since: spot.occupiedSince,
                minutesParked: 0,
                charge: charge ? { amountCop: charge.amountCop, band: charge.band, status: charge.status } : null,
              }
            : null,
      };
    });
  }

  findSpot(spotId: string): Promise<{ id: string; siteId: string; status: SpotStatus } | null> {
    return this.db.parkingSpot.findUnique({ where: { id: spotId }, select: { id: true, siteId: true, status: true } });
  }

  async setStatus(spotId: string, status: 'FREE' | 'DISABLED', reason: string | null): Promise<void> {
    await this.db.parkingSpot.update({ where: { id: spotId }, data: { status, disabledReason: reason } });
  }
}
