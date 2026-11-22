import type { RateDefinition } from '../../rates/domain/default-rates';
import type { SpotBlueprint } from '../domain/spot-layout';
import type { SiteSummary } from '../domain/site';

/** Todo lo necesario para crear una sede completa de una sola vez. */
export interface NewSiteData {
  name: string;
  department: string;
  city: string;
  spots: readonly SpotBlueprint[];
  rates: readonly RateDefinition[];
}

export interface SiteRepository {
  existsByName(name: string): Promise<boolean>;
  /** Crea la sede con sus espacios y tarifas en una sola transacción. */
  create(data: NewSiteData): Promise<SiteSummary>;
  list(): Promise<SiteSummary[]>;
  findById(id: string): Promise<SiteSummary | null>;
}
