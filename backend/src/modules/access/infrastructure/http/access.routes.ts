import { Router } from 'express';
import { errorResponses } from '../../../../infrastructure/openapi/common-schemas';
import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { TAGS } from '../../../../infrastructure/openapi/tags';
import { z } from '../../../../shared/zod';
import type { AuthGuards } from '../../../auth/infrastructure/http/auth.guards';
import type { ReadPlateUseCase } from '../../application/read-plate.use-case';
import { PlateReadingRequestSchema, PlateReadingResponseSchema } from './access.schemas';

const json = (schema: z.ZodType) => ({ 'application/json': { schema } });

openApiRegistry.registerPath({
  method: 'post',
  path: '/api/access/plate-readings',
  tags: [TAGS.access.name],
  summary: 'Interpretar una lectura de placa',
  description:
    'Recibe lo que leyó la cámara simulada y decide: aceptar la placa (con su tipo de vehículo), ' +
    'pedir otro intento si la confianza es baja (máximo 3) o pasar a validación del empleado. ' +
    'No registra el ingreso; eso lo hace el endpoint de ingresos.',
  security: [{ bearerAuth: [] }],
  request: { body: { content: json(PlateReadingRequestSchema) } },
  responses: {
    200: { description: 'Decisión sobre la lectura.', content: json(PlateReadingResponseSchema) },
    ...errorResponses({
      400: 'Datos inválidos (VALIDATION_ERROR).',
      401: 'Sin sesión (AUTH_REQUIRED) o sesión inválida.',
    }),
  },
});

export interface AccessUseCases {
  readPlate: ReadPlateUseCase;
}

export function createAccessRouter(useCases: AccessUseCases, guards: AuthGuards): Router {
  const router = Router();

  router.post('/plate-readings', guards.authenticate, (req, res) => {
    const input = PlateReadingRequestSchema.parse(req.body);
    const body: z.infer<typeof PlateReadingResponseSchema> = useCases.readPlate.execute(input);
    res.json(body);
  });

  return router;
}
