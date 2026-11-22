import type { VehicleType } from '../../../shared/domain/vehicle-type';

/** Prefijo del código de cada espacio: C-01 para carros, M-01 para motos. */
const SPOT_PREFIX: Record<VehicleType, string> = {
  CAR: 'C',
  MOTORCYCLE: 'M',
};

export interface SpotBlueprint {
  code: string;
  vehicleType: VehicleType;
}

/**
 * Genera los espacios de una sede nueva a partir de cuántos son de carro y
 * cuántos de moto. Lo usan el seed y la creación de sedes, así la regla de
 * nombres vive en un solo lugar.
 */
export function buildSpotLayout(carSpots: number, motorcycleSpots: number): SpotBlueprint[] {
  return [
    ...numberedSpots('CAR', carSpots),
    ...numberedSpots('MOTORCYCLE', motorcycleSpots),
  ];
}

function numberedSpots(vehicleType: VehicleType, count: number): SpotBlueprint[] {
  const digits = Math.max(2, String(count).length);
  return Array.from({ length: count }, (_, index) => ({
    code: `${SPOT_PREFIX[vehicleType]}-${String(index + 1).padStart(digits, '0')}`,
    vehicleType,
  }));
}
