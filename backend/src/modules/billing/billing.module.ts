import { prisma } from '../../infrastructure/persistence/prisma';
import { SystemClock } from '../../infrastructure/time/system-clock';
import type { EventPublisher } from '../../shared/domain/events';
import type { AuthGuards } from '../auth/infrastructure/http/auth.guards';
import { FindPendingChargesUseCase, PayChargeUseCase } from './application/billing.use-cases';
import { createBillingRouter } from './infrastructure/http/billing.routes';
import { PrismaBillingRepository } from './infrastructure/prisma-billing.repository';

/** Ensambla el módulo de cobros y pagos. */
export function createBillingModule(guards: AuthGuards, events: EventPublisher) {
  const billing = new PrismaBillingRepository(prisma);

  return {
    router: createBillingRouter(
      {
        findPending: new FindPendingChargesUseCase(billing),
        pay: new PayChargeUseCase(billing, events, new SystemClock()),
      },
      guards,
    ),
  };
}
