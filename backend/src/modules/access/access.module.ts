import { env } from '../../config/env';
import type { AuthGuards } from '../auth/infrastructure/http/auth.guards';
import { ReadPlateUseCase } from './application/read-plate.use-case';
import { createAccessRouter } from './infrastructure/http/access.routes';

/** Ensambla el módulo de accesos: lectura de placas, ingresos y salidas. */
export function createAccessModule(guards: AuthGuards) {
  return {
    router: createAccessRouter({ readPlate: new ReadPlateUseCase(env.PLATE_CONFIDENCE_THRESHOLD) }, guards),
  };
}
