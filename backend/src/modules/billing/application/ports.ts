import type { Charge } from '../domain/charge';

export interface ChargeRecord extends Charge {
  siteId: string;
}

export interface PaymentRecord {
  id: string;
  chargeId: string;
  amountCop: number;
  reference: string;
  paidAt: Date;
  receivedBy: { id: string; fullName: string };
}

export interface NewPayment {
  chargeId: string;
  amountCop: number;
  reference: string;
  receivedById: string;
  paidAt: Date;
}

export interface BillingRepository {
  findPendingByPlate(siteId: string, plate: string): Promise<ChargeRecord[]>;
  findCharge(id: string): Promise<ChargeRecord | null>;
  findPaymentByReference(reference: string): Promise<PaymentRecord | null>;
  findDayBandStart(siteId: string): Promise<string>;
  /** Marca el cobro como pagado y guarda el pago, en una transacción. */
  recordPayment(payment: NewPayment): Promise<PaymentRecord>;
}
