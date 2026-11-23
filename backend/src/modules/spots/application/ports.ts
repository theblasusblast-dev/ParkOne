import type { SpotStatus } from '../../../shared/domain/spot-status';
import type { VehicleType } from '../../../shared/domain/vehicle-type';
import type { SpotView } from '../domain/spot';

export interface SpotFilter {
  status?: SpotStatus;
  vehicleType?: VehicleType;
  /** Busca espacios ocupados por placas que contengan este texto. */
  plate?: string;
}

export interface SpotRepository {
  siteExists(siteId: string): Promise<boolean>;
  /** Espacios de la sede con su ocupante; minutesParked lo calcula el caso de uso. */
  listMap(siteId: string, filter: SpotFilter): Promise<SpotView[]>;
  findSpot(spotId: string): Promise<{ id: string; siteId: string; status: SpotStatus } | null>;
  setStatus(spotId: string, status: 'FREE' | 'DISABLED', reason: string | null): Promise<void>;
}
