import { env } from '../../config/env';
import { prisma } from '../../infrastructure/persistence/prisma';
import { SystemClock } from '../../infrastructure/time/system-clock';
import type { EventPublisher } from '../../shared/domain/events';
import type { AuthGuards } from '../auth/infrastructure/http/auth.guards';
import { ReadPlateUseCase } from './application/read-plate.use-case';
import { RegisterEntryUseCase } from './application/register-entry.use-case';
import { RegisterExitUseCase } from './application/register-exit.use-case';
import { RegisterManualEntryUseCase } from './application/register-manual-entry.use-case';
import { createAccessRouter } from './infrastructure/http/access.routes';
import { PrismaAccessRepository } from './infrastructure/prisma-access.repository';

/** Ensambla el módulo de accesos: lectura de placas, ingresos y salidas. */
export function createAccessModule(guards: AuthGuards, events: EventPublisher) {
  const access = new PrismaAccessRepository(prisma);
  const clock = new SystemClock();
  const registerEntry = new RegisterEntryUseCase(access, clock, events);

  return {
    router: createAccessRouter(
      {
        readPlate: new ReadPlateUseCase(env.PLATE_CONFIDENCE_THRESHOLD),
        registerEntry,
        registerManualEntry: new RegisterManualEntryUseCase(registerEntry),
        registerExit: new RegisterExitUseCase(access, clock, events),
      },
      guards,
    ),
  };
}
