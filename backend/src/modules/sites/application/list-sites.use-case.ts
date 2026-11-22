import type { SiteSummary } from '../domain/site';
import type { SiteRepository } from './ports';

/** Lista todas las sedes con su capacidad y ocupación (solo administrador). */
export class ListSitesUseCase {
  constructor(private readonly sites: SiteRepository) {}

  execute(): Promise<SiteSummary[]> {
    return this.sites.list();
  }
}
