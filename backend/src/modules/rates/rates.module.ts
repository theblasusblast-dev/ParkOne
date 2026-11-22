import { prisma } from '../../infrastructure/persistence/prisma';
import { SystemClock } from '../../infrastructure/time/system-clock';
import type { AuthGuards } from '../auth/infrastructure/http/auth.guards';
import {
  GetRateHistoryUseCase,
  GetSiteRatesUseCase,
  UpdateSiteBandsUseCase,
  UpdateSiteRatesUseCase,
} from './application/site-rates.use-cases';
import { createRatesRouter } from './infrastructure/http/rates.routes';
import { PrismaRateRepository } from './infrastructure/prisma-rate.repository';

/** Ensambla el módulo de tarifas y franjas. */
export function createRatesModule(guards: AuthGuards) {
  const rates = new PrismaRateRepository(prisma);

  return {
    router: createRatesRouter(
      {
        get: new GetSiteRatesUseCase(rates),
        history: new GetRateHistoryUseCase(rates),
        update: new UpdateSiteRatesUseCase(rates, new SystemClock()),
        updateBands: new UpdateSiteBandsUseCase(rates),
      },
      guards,
    ),
  };
}
