import type { Band } from '../../../shared/domain/band';

/** Ciclo de vida de un cobro: PENDING → PAID → EXPIRED, o PENDING → VOIDED. */
export const CHARGE_STATUSES = ['PENDING', 'PAID', 'VOIDED', 'EXPIRED'] as const;

export type ChargeStatus = (typeof CHARGE_STATUSES)[number];

/** Cobro del día operativo de una placa en una sede (pase diario, S-03). */
export interface Charge {
  id: string;
  plate: string;
  operatingDay: string;
  band: Band;
  amountCop: number;
  status: ChargeStatus;
}
