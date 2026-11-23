import { prisma } from '../../infrastructure/persistence/prisma';
import { SystemClock } from '../../infrastructure/time/system-clock';
import type { EventPublisher } from '../../shared/domain/events';
import type { AuthGuards } from '../auth/infrastructure/http/auth.guards';
import { ChangeSpotStatusUseCase, GetSpotMapUseCase } from './application/spots.use-cases';
import { createSpotsRouters } from './infrastructure/http/spots.routes';
import { PrismaSpotRepository } from './infrastructure/prisma-spot.repository';

/** Ensambla el módulo de espacios: mapa y gestión de estados. */
export function createSpotsModule(guards: AuthGuards, events: EventPublisher) {
  const spots = new PrismaSpotRepository(prisma);
  return createSpotsRouters(
    {
      map: new GetSpotMapUseCase(spots, new SystemClock()),
      changeStatus: new ChangeSpotStatusUseCase(spots, events),
    },
    guards,
  );
}
