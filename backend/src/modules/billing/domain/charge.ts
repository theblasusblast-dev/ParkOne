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

/**
 * Transiciones permitidas del ciclo de vida (patrón State simplificado):
 * cada estado declara a cuáles puede pasar. Pagar un cobro anulado, por
 * ejemplo, no está permitido.
 */
const TRANSITIONS: Record<ChargeStatus, readonly ChargeStatus[]> = {
  PENDING: ['PAID', 'VOIDED', 'EXPIRED'],
  PAID: ['EXPIRED'],
  VOIDED: [],
  EXPIRED: [],
};

export function canTransition(from: ChargeStatus, to: ChargeStatus): boolean {
  return TRANSITIONS[from].includes(to);
}
