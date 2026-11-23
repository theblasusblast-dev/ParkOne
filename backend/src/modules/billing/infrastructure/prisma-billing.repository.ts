import type { PrismaClient } from '@prisma/client';
import { AppError } from '../../../shared/app-error';
import type { BillingRepository, ChargeRecord, NewPayment, PaymentRecord } from '../application/ports';

const CHARGE_FIELDS = {
  id: true,
  siteId: true,
  plate: true,
  operatingDay: true,
  band: true,
  amountCop: true,
  status: true,
} as const;

const PAYMENT_FIELDS = {
  id: true,
  chargeId: true,
  amountCop: true,
  reference: true,
  paidAt: true,
  receivedBy: { select: { id: true, fullName: true } },
} as const;

type ChargeRow = Omit<ChargeRecord, 'operatingDay'> & { operatingDay: Date };

const toCharge = (row: ChargeRow): ChargeRecord => ({ ...row, operatingDay: row.operatingDay.toISOString().slice(0, 10) });

/** Adaptador de persistencia de cobros y pagos con Prisma. */
export class PrismaBillingRepository implements BillingRepository {
  constructor(private readonly db: PrismaClient) {}

  async findPendingByPlate(siteId: string, plate: string): Promise<ChargeRecord[]> {
    const rows = await this.db.charge.findMany({
      where: { siteId, plate, status: 'PENDING' },
      orderBy: { operatingDay: 'asc' },
      select: CHARGE_FIELDS,
    });
    return rows.map(toCharge);
  }

  async findCharge(id: string): Promise<ChargeRecord | null> {
    const row = await this.db.charge.findUnique({ where: { id }, select: CHARGE_FIELDS });
    return row ? toCharge(row) : null;
  }

  findPaymentByReference(reference: string): Promise<PaymentRecord | null> {
    return this.db.payment.findUnique({ where: { reference }, select: PAYMENT_FIELDS });
  }

  async findDayBandStart(siteId: string): Promise<string> {
    const site = await this.db.site.findUniqueOrThrow({ where: { id: siteId }, select: { dayBandStart: true } });
    return site.dayBandStart;
  }

  recordPayment(payment: NewPayment): Promise<PaymentRecord> {
    return this.db.$transaction(async (tx) => {
      // Solo pasa a pagado si sigue pendiente: dos pagos simultáneos no lo pagan dos veces.
      const updated = await tx.charge.updateMany({
        where: { id: payment.chargeId, status: 'PENDING' },
        data: { status: 'PAID', paidAt: payment.paidAt },
      });
      if (updated.count === 0) {
        throw new AppError(409, 'CHARGE_ALREADY_PAID', 'Este cobro ya está pagado.');
      }
      return tx.payment.create({ data: { ...payment, method: 'CASH' }, select: PAYMENT_FIELDS });
    });
  }
}
