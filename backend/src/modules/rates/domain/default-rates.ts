import type { Band } from '../../../shared/domain/band';
import type { VehicleType } from '../../../shared/domain/vehicle-type';

export interface RateDefinition {
  vehicleType: VehicleType;
  band: Band;
  /** Valor en pesos colombianos. */
  amountCop: number;
}

/**
 * Tarifas con las que nace toda sede nueva (y la sede del seed). El
 * administrador las ajusta después. La moto queda en $0: no paga (RN-01),
 * pero como es una tarifa y no una excepción en el código, se puede cambiar.
 */
export const DEFAULT_RATES: readonly RateDefinition[] = [
  { vehicleType: 'CAR', band: 'DAY', amountCop: 8000 },
  { vehicleType: 'CAR', band: 'NIGHT', amountCop: 5000 },
  { vehicleType: 'MOTORCYCLE', band: 'DAY', amountCop: 0 },
  { vehicleType: 'MOTORCYCLE', band: 'NIGHT', amountCop: 0 },
];
