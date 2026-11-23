import { Router } from 'express';
import { errorResponses } from '../../../../infrastructure/openapi/common-schemas';
import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { TAGS } from '../../../../infrastructure/openapi/tags';
import { z } from '../../../../shared/zod';
import { currentUserOf, type AuthGuards } from '../../../auth/infrastructure/http/auth.guards';
import { SiteIdParamsSchema } from '../../../sites/infrastructure/http/sites.schemas';
import type { ChangeSpotStatusUseCase, GetSpotMapUseCase } from '../../application/spots.use-cases';
import type { SpotView } from '../../domain/spot';
import { ChangeSpotStatusRequestSchema, SpotIdParamsSchema, SpotMapQuerySchema, SpotSchema } from './spots.schemas';

const json = (schema: z.ZodType) => ({ 'application/json': { schema } });

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/sites/{id}/spots',
  tags: [TAGS.spots.name],
  summary: 'Mapa de espacios de una sede',
  description:
    'Todos los espacios de la sede, primero los de carro y luego los de moto, con su estado y, si están ocupados, ' +
    'placa, tiempo en uso y cobro. Se puede filtrar por estado, tipo de vehículo y placa. El empleado solo ve su sede.',
  security: [{ bearerAuth: [] }],
  request: { params: SiteIdParamsSchema, query: SpotMapQuerySchema },
  responses: {
    200: { description: 'Espacios de la sede.', content: json(z.array(SpotSchema)) },
    ...errorResponses({
      400: 'Filtro inválido (VALIDATION_ERROR).',
      401: 'Sin sesión (AUTH_REQUIRED) o sesión inválida.',
      403: 'El empleado consulta otra sede (SITE_FORBIDDEN).',
      404: 'No existe la sede (SITE_NOT_FOUND).',
    }),
  },
});

openApiRegistry.registerPath({
  method: 'patch',
  path: '/api/spots/{id}',
  tags: [TAGS.spots.name],
  summary: 'Habilitar o inhabilitar un espacio',
  description:
    'Inhabilita un espacio libre con un motivo, o vuelve a habilitar uno inhabilitado. ' +
    'Los espacios inhabilitados no cuentan como cupo. El cambio se emite en tiempo real al mapa.',
  security: [{ bearerAuth: [] }],
  request: { params: SpotIdParamsSchema, body: { content: json(ChangeSpotStatusRequestSchema) } },
  responses: {
    204: { description: 'Estado actualizado.' },
    ...errorResponses({
      400: 'Datos inválidos (VALIDATION_ERROR) o falta el motivo (REASON_REQUIRED).',
      401: 'Sin sesión (AUTH_REQUIRED) o sesión inválida.',
      403: 'El espacio es de otra sede (SITE_FORBIDDEN).',
      404: 'No existe el espacio (SPOT_NOT_FOUND).',
      409: 'Espacio ocupado (SPOT_OCCUPIED), ya inhabilitado (SPOT_ALREADY_DISABLED) o no inhabilitado (SPOT_NOT_DISABLED).',
    }),
  },
});

function toSpotResponse(spot: SpotView): z.infer<typeof SpotSchema> {
  return { ...spot, occupant: spot.occupant ? { ...spot.occupant, since: spot.occupant.since.toISOString() } : null };
}

export interface SpotsUseCases {
  map: GetSpotMapUseCase;
  changeStatus: ChangeSpotStatusUseCase;
}

/** Dos routers: el mapa cuelga de /api/sites/:id y el cambio de estado de /api/spots. */
export function createSpotsRouters(useCases: SpotsUseCases, guards: AuthGuards) {
  const bySite = Router();
  bySite.get('/:id/spots', guards.authenticate, async (req, res) => {
    const { id } = SiteIdParamsSchema.parse(req.params);
    const filter = SpotMapQuerySchema.parse(req.query);
    const spots = await useCases.map.execute(currentUserOf(req), id, {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.vehicleType ? { vehicleType: filter.vehicleType } : {}),
      ...(filter.plate ? { plate: filter.plate } : {}),
    });
    res.json(spots.map(toSpotResponse));
  });

  const spots = Router();
  spots.patch('/:id', guards.authenticate, async (req, res) => {
    const { id } = SpotIdParamsSchema.parse(req.params);
    const { status, reason } = ChangeSpotStatusRequestSchema.parse(req.body);
    await useCases.changeStatus.execute(currentUserOf(req), id, status, reason);
    res.status(204).end();
  });

  return { bySite, spots };
}
