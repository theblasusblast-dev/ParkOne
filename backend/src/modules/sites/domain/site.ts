import type { SpotStatus } from '../../../shared/domain/spot-status';
import { VEHICLE_TYPES, type VehicleType } from '../../../shared/domain/vehicle-type';

/** Conteo de espacios de un tipo de vehículo en una sede. */
export interface SpotCounts {
  total: number;
  free: number;
  occupied: number;
  disabled: number;
}

/** Capacidad de una sede por tipo de vehículo: { CAR: {...}, MOTORCYCLE: {...} }. */
export type Capacity = Record<VehicleType, SpotCounts>;

export interface SiteSummary {
  id: string;
  name: string;
  department: string;
  city: string;
  dayBandStart: string;
  nightBandStart: string;
  active: boolean;
  capacity: Capacity;
}

/** Cuántos espacios hay de cierto tipo y estado (viene de un GROUP BY). */
export interface SpotTally {
  vehicleType: VehicleType;
  status: SpotStatus;
  count: number;
}

// Record<SpotStatus, ...> obliga a cubrir todos los estados: si se agrega uno
// nuevo, TypeScript marca error aquí hasta que se le asigne su contador.
const COUNT_KEY: Record<SpotStatus, keyof Omit<SpotCounts, 'total'>> = {
  FREE: 'free',
  OCCUPIED: 'occupied',
  DISABLED: 'disabled',
};

/**
 * Convierte los conteos por tipo y estado en la capacidad de la sede.
 * Recorre VEHICLE_TYPES, así que un tipo nuevo de vehículo aparece aquí
 * sin modificar esta función.
 */
export function summarizeCapacity(tallies: readonly SpotTally[]): Capacity {
  const capacity = Object.fromEntries(
    VEHICLE_TYPES.map((type) => [type, { total: 0, free: 0, occupied: 0, disabled: 0 }]),
  ) as Capacity;

  for (const tally of tallies) {
    const counts = capacity[tally.vehicleType];
    counts.total += tally.count;
    counts[COUNT_KEY[tally.status]] += tally.count;
  }
  return capacity;
}
