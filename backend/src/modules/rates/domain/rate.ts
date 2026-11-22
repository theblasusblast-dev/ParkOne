import type { Band } from '../../../shared/domain/band';
import type { VehicleType } from '../../../shared/domain/vehicle-type';

/** Una versión de tarifa. validTo es null mientras está vigente (RN-07). */
export interface Rate {
  id: string;
  vehicleType: VehicleType;
  band: Band;
  amountCop: number;
  validFrom: Date;
  validTo: Date | null;
}

/** Par de tarifas de un tipo de vehículo, tal como lo configura el administrador. */
export interface RatePair {
  vehicleType: VehicleType;
  dayAmountCop: number;
  nightAmountCop: number;
}

/**
 * RN-02: la tarifa nocturna siempre es menor que la diurna.
 * Excepción: un tipo con ambas en $0 no cobra (RN-01, como la moto).
 */
export function respectsNightDiscount(pair: RatePair): boolean {
  const isFree = pair.dayAmountCop === 0 && pair.nightAmountCop === 0;
  return isFree || pair.nightAmountCop < pair.dayAmountCop;
}
