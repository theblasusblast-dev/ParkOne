import { AppError } from '../../../shared/app-error';
import type { Clock } from '../../../shared/domain/clock';
import type { EventPublisher } from '../../../shared/domain/events';
import { formatCop } from '../../../shared/domain/money';
import type { VehicleType } from '../../../shared/domain/vehicle-type';
import { assertSiteAccess } from '../../auth/domain/site-access';
import type { PublicProfile } from '../../auth/domain/user-account';
import type { Charge } from '../../billing/domain/charge';
import { bandOf, operatingDayOf } from '../domain/operating-calendar';
import type { AccessEventData, AccessRepository, NewCharge, SpotRef } from './ports';

export interface EntryInput {
  siteId: string;
  plate: string;
  vehicleType: VehicleType;
  confidence: number | null;
  region: string | null;
  manualRead: boolean;
  foreignPlate: boolean;
}

export type EntryOutcome = 'ADMITTED' | 'FULL' | 'ALREADY_INSIDE';

export interface EntryResult {
  eventId: string;
  outcome: EntryOutcome;
  barrierOpened: boolean;
  message: string;
  plate: string;
  vehicleType: VehicleType;
  spot: SpotRef | null;
  charge: Charge | null;
  reentry: boolean;
}

const TYPE_LABEL: Record<VehicleType, string> = { CAR: 'carros', MOTORCYCLE: 'motos' };
const BAND_LABEL = { DAY: 'diurno', NIGHT: 'nocturno' } as const;

/**
 * Ingreso de un vehículo. Valida en orden: anti-passback → cupo → cobro.
 *   - Si la placa ya está adentro, no entra (anti-passback).
 *   - Si no hay espacio libre de su tipo, LLENO y no se genera cobro (F-07).
 *   - Si ya tiene cobro en el día operativo, es un reingreso sin cobro nuevo (RN-03, RN-04).
 *   - Si no, se cobra la tarifa de la franja de este primer ingreso (RN-05);
 *     una tarifa de $0, como la de la moto, no genera cobro (RN-01).
 */
export class RegisterEntryUseCase {
  constructor(
    private readonly access: AccessRepository,
    private readonly clock: Clock,
    private readonly events: EventPublisher,
  ) {}

  async execute(user: PublicProfile, input: EntryInput): Promise<EntryResult> {
    assertSiteAccess(user, input.siteId);

    const schedule = await this.access.findSchedule(input.siteId);
    if (!schedule) throw new AppError(404, 'SITE_NOT_FOUND', 'No existe una sede con ese id.');

    const now = this.clock.now();
    const event = (barrierOpened: boolean, decisionReason: string, spotId: string | null): AccessEventData => ({
      siteId: input.siteId,
      plate: input.plate,
      vehicleType: input.vehicleType,
      direction: 'ENTRY',
      occurredAt: now,
      confidence: input.confidence,
      plateRegion: input.region,
      manualRead: input.manualRead,
      foreignPlate: input.foreignPlate,
      barrierOpened,
      decisionReason,
      spotId,
      operatorId: input.manualRead ? user.id : null,
    });
    const announce = (outcome: EntryOutcome, barrierOpened: boolean, message: string, spot: SpotRef | null) =>
      this.events.publish({
        type: 'ACCESS_DECIDED',
        siteId: input.siteId,
        direction: 'ENTRY',
        plate: input.plate,
        outcome,
        barrierOpened,
        message,
        spotCode: spot?.code ?? null,
      });
    const denied = async (outcome: EntryOutcome, message: string, spot: SpotRef | null): Promise<EntryResult> => {
      const eventId = await this.access.recordEvent(event(false, message, spot?.id ?? null));
      announce(outcome, false, message, spot);
      return { eventId, outcome, barrierOpened: false, message, plate: input.plate, vehicleType: input.vehicleType, spot, charge: null, reentry: false };
    };

    // 1. Anti-passback
    const current = await this.access.findOccupancy(input.siteId, input.plate);
    if (current) {
      return denied('ALREADY_INSIDE', `La placa ${input.plate} ya figura adentro (espacio ${current.spot.code}). Avise al empleado.`, current.spot);
    }

    // 2. Cupo
    const spot = await this.access.findFreeSpot(input.siteId, input.vehicleType);
    if (!spot) {
      return denied('FULL', `LLENO: no hay espacios libres para ${TYPE_LABEL[input.vehicleType]}.`, null);
    }

    // 3. Cobro del día operativo
    const operatingDay = operatingDayOf(now, schedule.dayBandStart);
    const existing = await this.access.findCharge(input.siteId, input.plate, operatingDay);
    let newCharge: NewCharge | null = null;

    if (!existing) {
      const band = bandOf(now, schedule.dayBandStart, schedule.nightBandStart);
      const rate = await this.access.findCurrentRate(input.siteId, input.vehicleType, band);
      if (!rate) throw new AppError(409, 'RATE_NOT_CONFIGURED', 'La sede no tiene tarifa vigente para este vehículo y franja.');
      if (rate.amountCop > 0) {
        newCharge = { operatingDay, band, rateId: rate.id, amountCop: rate.amountCop };
      }
    }

    const message = welcomeMessage(spot, existing, newCharge);
    const admitted = await this.access.admit(spot.id, event(true, message, spot.id), newCharge);
    announce('ADMITTED', true, message, spot);
    this.events.publish({ type: 'SPOTS_CHANGED', siteId: input.siteId });

    return {
      eventId: admitted.eventId,
      outcome: 'ADMITTED',
      barrierOpened: true,
      message,
      plate: input.plate,
      vehicleType: input.vehicleType,
      spot,
      charge: admitted.charge ?? existing,
      reentry: existing !== null,
    };
  }
}

function welcomeMessage(spot: SpotRef, existing: Charge | null, newCharge: NewCharge | null): string {
  const go = `Diríjase al espacio ${spot.code}.`;
  if (existing?.status === 'PAID') return `Bienvenido de nuevo. ${go} Su pase del día sigue vigente.`;
  if (existing) return `Bienvenido de nuevo. ${go} Tiene un cobro pendiente de ${formatCop(existing.amountCop)}.`;
  if (newCharge) return `Bienvenido. ${go} Cobro ${BAND_LABEL[newCharge.band]}: ${formatCop(newCharge.amountCop)}.`;
  return `Bienvenido. ${go}`;
}
