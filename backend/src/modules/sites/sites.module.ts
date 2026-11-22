import { prisma } from '../../infrastructure/persistence/prisma';
import type { AuthGuards } from '../auth/infrastructure/http/auth.guards';
import { CreateSiteUseCase } from './application/create-site.use-case';
import { GetSiteUseCase } from './application/get-site.use-case';
import { ListSitesUseCase } from './application/list-sites.use-case';
import { createSitesRouter } from './infrastructure/http/sites.routes';
import { PrismaSiteRepository } from './infrastructure/prisma-site.repository';

/** Ensambla el módulo de sedes. Recibe las guardias del módulo de autenticación. */
export function createSitesModule(guards: AuthGuards) {
  const sites = new PrismaSiteRepository(prisma);

  return {
    router: createSitesRouter(
      {
        create: new CreateSiteUseCase(sites),
        list: new ListSitesUseCase(sites),
        get: new GetSiteUseCase(sites),
      },
      guards,
    ),
  };
}
