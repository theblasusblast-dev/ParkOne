import { prisma } from '../../infrastructure/persistence/prisma';
import type { AuthGuards } from '../auth/infrastructure/http/auth.guards';
import { HistoryQueries } from './application/history';
import { createHistoryRouter } from './infrastructure/http/history.routes';
import { PrismaHistoryRepository } from './infrastructure/prisma-history.repository';

/** Ensambla el módulo de historial (solo lectura). */
export function createHistoryModule(guards: AuthGuards) {
  return { router: createHistoryRouter(new HistoryQueries(new PrismaHistoryRepository(prisma)), guards) };
}
