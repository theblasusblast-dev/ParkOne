import { Router } from 'express';
import { errorResponses } from '../../../../infrastructure/openapi/common-schemas';
import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { TAGS } from '../../../../infrastructure/openapi/tags';
import { z } from '../../../../shared/zod';
import { currentUserOf, type AuthGuards } from '../../../auth/infrastructure/http/auth.guards';
import type { ReadPlateUseCase } from '../../application/read-plate.use-case';
import type { RegisterEntryUseCase } from '../../application/register-entry.use-case';
import type { RegisterManualEntryUseCase } from '../../application/register-manual-entry.use-case';
import {
  EntryRequestSchema,
  EntryResultSchema,
  ManualEntryRequestSchema,
  PlateReadingRequestSchema,
  PlateReadingResponseSchema,
} from './access.schemas';

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

openApiRegistry.registerPath({
  method: 'post',
  path: '/api/access/entries',
  tags: [TAGS.access.name],
  summary: 'Registrar ingreso',
  description:
    'Registra la llegada de un vehículo. Valida en orden: anti-passback, cupo y cobro. ' +
    'Si entra, le asigna el primer espacio libre de su tipo y, en su primer ingreso del día operativo, ' +
    'genera el cobro de la franja actual (moto con tarifa $0: sin cobro). ' +
    'Siempre registra el evento, también cuando la barrera no abre.',
  security: [{ bearerAuth: [] }],
  request: { body: { content: json(EntryRequestSchema) } },
  responses: {
    201: { description: 'Evento registrado con la decisión de la barrera.', content: json(EntryResultSchema) },
    ...errorResponses({
      400: 'Datos inválidos (VALIDATION_ERROR).',
      401: 'Sin sesión (AUTH_REQUIRED) o sesión inválida.',
      403: 'El empleado registra en otra sede (SITE_FORBIDDEN).',
      404: 'No existe la sede (SITE_NOT_FOUND).',
      409: 'La sede no tiene tarifa vigente (RATE_NOT_CONFIGURED) o el espacio se ocupó al mismo tiempo (SPOT_TAKEN).',
    }),
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/api/access/manual-entries',
  tags: [TAGS.access.name],
  summary: 'Registrar ingreso con lectura manual',
  description:
    'El empleado digita o corrige la placa cuando la cámara no la reconoce, o registra una placa extranjera. ' +
    'Sigue las mismas reglas de cupo y cobro del ingreso normal, y el evento queda marcado como lectura manual ' +
    'con el empleado que intervino (F-06).',
  security: [{ bearerAuth: [] }],
  request: { body: { content: json(ManualEntryRequestSchema) } },
  responses: {
    201: { description: 'Evento registrado con la decisión de la barrera.', content: json(EntryResultSchema) },
    ...errorResponses({
      400: 'Datos inválidos (VALIDATION_ERROR) o placa sin formato colombiano y no marcada como extranjera (INVALID_PLATE).',
      401: 'Sin sesión (AUTH_REQUIRED) o sesión inválida.',
      403: 'El empleado registra en otra sede (SITE_FORBIDDEN).',
      404: 'No existe la sede (SITE_NOT_FOUND).',
    }),
  },
});

export interface AccessUseCases {
  readPlate: ReadPlateUseCase;
  registerEntry: RegisterEntryUseCase;
  registerManualEntry: RegisterManualEntryUseCase;
}

export function createAccessRouter(useCases: AccessUseCases, guards: AuthGuards): Router {
  const router = Router();

  router.post('/plate-readings', guards.authenticate, (req, res) => {
    const input = PlateReadingRequestSchema.parse(req.body);
    const body: z.infer<typeof PlateReadingResponseSchema> = useCases.readPlate.execute(input);
    res.json(body);
  });

  router.post('/entries', guards.authenticate, async (req, res) => {
    const input = EntryRequestSchema.parse(req.body);
    const body: z.infer<typeof EntryResultSchema> = await useCases.registerEntry.execute(currentUserOf(req), {
      ...input,
      manualRead: false,
      foreignPlate: false,
    });
    res.status(201).json(body);
  });

  router.post('/manual-entries', guards.authenticate, async (req, res) => {
    const input = ManualEntryRequestSchema.parse(req.body);
    const body: z.infer<typeof EntryResultSchema> = await useCases.registerManualEntry.execute(currentUserOf(req), input);
    res.status(201).json(body);
  });

  return router;
}
