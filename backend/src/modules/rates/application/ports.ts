import type { Band } from '../../../shared/domain/band';
import type { VehicleType } from '../../../shared/domain/vehicle-type';
import type { Rate } from '../domain/rate';

export interface SiteBands {
  dayBandStart: string;
  nightBandStart: string;
}

export interface RateVersion {
  vehicleType: VehicleType;
  band: Band;
  amountCop: number;
}

export interface RateRepository {
  /** Franjas de la sede, o null si la sede no existe. */
  findBands(siteId: string): Promise<SiteBands | null>;
  currentRates(siteId: string): Promise<Rate[]>;
  history(siteId: string): Promise<Rate[]>;
  /** Cierra la versión vigente de cada tarifa y crea la nueva, en una transacción. */
  replace(siteId: string, versions: readonly RateVersion[], at: Date): Promise<void>;
  updateBands(siteId: string, bands: SiteBands): Promise<SiteBands>;
}
