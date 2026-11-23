import { AppError } from '../../../shared/app-error';
import type { Clock } from '../../../shared/domain/clock';
import type { EventPublisher } from '../../../shared/domain/events';
import { operatingDayEnd } from '../../access/domain/operating-calendar';
import { assertSiteAccess } from '../../auth/domain/site-access';
import type { PublicProfile } from '../../auth/domain/user-account';
import { canTransition } from '../domain/charge';
import type { BillingRepository, ChargeRecord, PaymentRecord } from './ports';

/** Cobros pendientes de una placa en una sede, para la caja. */
export class FindPendingChargesUseCase {
  constructor(private readonly billing: BillingRepository) {}

  execute(user: PublicProfile, siteId: string, plate: string): Promise<ChargeRecord[]> {
    assertSiteAccess(user, siteId);
    return this.billing.findPendingByPlate(siteId, plate.toUpperCase().replace(/[^A-Z0-9]/g, ''));
  }
}

export interface PayChargeInput {
  amountCop: number;
  /** Referencia única del pago: repetirla no duplica el pago (idempotencia). */
  reference: string;
}

export interface PayChargeResult {
  payment: PaymentRecord;
  charge: ChargeRecord;
  /** Hasta cuándo puede salir y reingresar sin pagar otra vez (fin del día operativo). */
  passValidUntil: Date;
  /** true si la referencia ya se había registrado y se devuelve el mismo pago. */
  replayed: boolean;
}

/** Pago en efectivo de un cobro desde la caja (F-04). */
export class PayChargeUseCase {
  constructor(
    private readonly billing: BillingRepository,
    private readonly events: EventPublisher,
    private readonly clock: Clock,
  ) {}

  async execute(user: PublicProfile, chargeId: string, input: PayChargeInput): Promise<PayChargeResult> {
    const charge = await this.billing.findCharge(chargeId);
    if (!charge) throw new AppError(404, 'CHARGE_NOT_FOUND', 'No existe un cobro con ese id.');
    assertSiteAccess(user, charge.siteId);

    // Idempotencia: la misma referencia devuelve el mismo pago, sin crear otro.
    const previous = await this.billing.findPaymentByReference(input.reference);
    if (previous) {
      if (previous.chargeId !== chargeId) {
        throw new AppError(409, 'REFERENCE_IN_USE', 'Esa referencia ya se usó para pagar otro cobro.');
      }
      return this.result(previous, charge, true);
    }

    if (charge.status === 'PAID') {
      throw new AppError(409, 'CHARGE_ALREADY_PAID', 'Este cobro ya está pagado.');
    }
    if (!canTransition(charge.status, 'PAID')) {
      throw new AppError(409, 'CHARGE_NOT_PAYABLE', `Un cobro en estado ${charge.status} no se puede pagar.`);
    }
    if (input.amountCop !== charge.amountCop) {
      throw new AppError(400, 'AMOUNT_MISMATCH', `El valor del cobro es ${charge.amountCop}; se recibió ${input.amountCop}.`);
    }

    const payment = await this.billing.recordPayment({
      chargeId,
      amountCop: input.amountCop,
      reference: input.reference,
      receivedById: user.id,
      paidAt: this.clock.now(),
    });

    this.events.publish({
      type: 'PAYMENT_CONFIRMED',
      siteId: charge.siteId,
      plate: charge.plate,
      chargeId,
      amountCop: charge.amountCop,
    });

    return this.result(payment, { ...charge, status: 'PAID' }, false);
  }

  private async result(payment: PaymentRecord, charge: ChargeRecord, replayed: boolean): Promise<PayChargeResult> {
    const dayBandStart = await this.billing.findDayBandStart(charge.siteId);
    return { payment, charge, passValidUntil: operatingDayEnd(charge.operatingDay, dayBandStart), replayed };
  }
}
