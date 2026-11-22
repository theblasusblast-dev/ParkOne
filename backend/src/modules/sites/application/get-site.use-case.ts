import { AppError } from '../../../shared/app-error';
import { assertSiteAccess } from '../../auth/domain/site-access';
import type { PublicProfile } from '../../auth/domain/user-account';
import type { SiteSummary } from '../domain/site';
import type { SiteRepository } from './ports';

/** Consulta una sede. El empleado solo puede consultar la suya. */
export class GetSiteUseCase {
  constructor(private readonly sites: SiteRepository) {}

  async execute(user: PublicProfile, siteId: string): Promise<SiteSummary> {
    assertSiteAccess(user, siteId);

    const site = await this.sites.findById(siteId);
    if (!site) {
      throw new AppError(404, 'SITE_NOT_FOUND', 'No existe una sede con ese id.');
    }
    return site;
  }
}
