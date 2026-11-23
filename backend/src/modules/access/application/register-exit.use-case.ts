import { AppError } from '../../../shared/app-error';
import type { Clock } from '../../../shared/domain/clock';
import type { EventPublisher } from '../../../shared/domain/events';
import { formatCop } from '../../../shared/domain/money';
import { assertSiteAccess } from '../../auth/domain/site-access';
import type { PublicProfile } from '../../auth/domain/user-account';
import type { Charge } from '../../billing/domain/charge';
import { operatingDayOf } from '../domain/operating-calendar';
import type { AccessEventData, AccessRepository, SpotRef } from './ports';

export interface ExitInput {
  siteId: string;
  plate: string;
}

export type ExitOutcome = 'RELEASED' | 'PENDING_CHARGE';

export interface ExitResult {
  eventId: string;
  outcome: ExitOutcome;
  barrierOpened: boolean;
  message: string;
  plate: string;
  spot: SpotRef;
  pendingCharges: Charge[];
}

/**
 * Salida de un vehículo. La barrera abre solo si no hay cobros pendientes
 * (RN-06). Si el vehículo sigue adentro desde un día operativo anterior, antes
 * se genera el cobro diurno del día nuevo (S-05), que también debe pagar.
 */
export class RegisterExitUseCase {
  constructor(
    private readonly access: AccessRepository,
    private readonly clock: Clock,
    private readonly events: EventPublisher,
  ) {}

  async execute(user: PublicProfile, input: ExitInput): Promise<ExitResult> {
    assertSiteAccess(user, input.siteId);
    const plate = input.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

    const schedule = await this.access.findSchedule(input.siteId);
    if (!schedule) throw new AppError(404, 'SITE_NOT_FOUND', 'No existe una sede con ese id.');

    const occupancy = await this.access.findOccupancy(input.siteId, plate);
    if (!occupancy) {
      throw new AppError(404, 'VEHICLE_NOT_INSIDE', `La placa ${plate} no tiene un ingreso registrado en esta sede.`);
    }

    const now = this.clock.now();
    const today = operatingDayOf(now, schedule.dayBandStart);

    // S-05: entró en un día operativo anterior y no tiene cobro de hoy.
    const enteredOn = operatingDayOf(occupancy.since, schedule.dayBandStart);
    if (enteredOn !== today && !(await this.access.findCharge(input.siteId, plate, today))) {
      const rate = await this.access.findCurrentRate(input.siteId, occupancy.vehicleType, 'DAY');
      if (rate && rate.amountCop > 0) {
        await this.access.createCharge(input.siteId, plate, occupancy.vehicleType, {
          operatingDay: today,
          band: 'DAY',
          rateId: rate.id,
          amountCop: rate.amountCop,
        });
      }
    }

    const pending = await this.access.findPendingCharges(input.siteId, plate);
    const event = (barrierOpened: boolean, decisionReason: string): AccessEventData => ({
      siteId: input.siteId,
      plate,
      vehicleType: occupancy.vehicleType,
      direction: 'EXIT',
      occurredAt: now,
      confidence: null,
      plateRegion: null,
      manualRead: false,
      foreignPlate: false,
      barrierOpened,
      decisionReason,
      spotId: occupancy.spot.id,
      operatorId: null,
    });

    let result: ExitResult;
    if (pending.length > 0) {
      const total = pending.reduce((sum, charge) => sum + charge.amountCop, 0);
      const message = `Cobro pendiente: ${formatCop(total)}. Pase por la caja antes de salir.`;
      const eventId = await this.access.recordEvent(event(false, message));
      result = { eventId, outcome: 'PENDING_CHARGE', barrierOpened: false, message, plate, spot: occupancy.spot, pendingCharges: pending };
    } else {
      const message = `Buen viaje. Espacio ${occupancy.spot.code} liberado.`;
      const eventId = await this.access.release(occupancy.spot.id, event(true, message));
      result = { eventId, outcome: 'RELEASED', barrierOpened: true, message, plate, spot: occupancy.spot, pendingCharges: [] };
      this.events.publish({ type: 'SPOTS_CHANGED', siteId: input.siteId });
    }

    this.events.publish({
      type: 'ACCESS_DECIDED',
      siteId: input.siteId,
      direction: 'EXIT',
      plate,
      outcome: result.outcome,
      barrierOpened: result.barrierOpened,
      message: result.message,
      spotCode: occupancy.spot.code,
    });
    return result;
  }
}
