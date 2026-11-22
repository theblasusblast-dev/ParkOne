import { Router } from 'express';
import { errorResponses } from '../../../../infrastructure/openapi/common-schemas';
import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { TAGS } from '../../../../infrastructure/openapi/tags';
import { z } from '../../../../shared/zod';
import { currentUserOf, type AuthGuards } from '../../../auth/infrastructure/http/auth.guards';
import { SiteIdParamsSchema } from '../../../sites/infrastructure/http/sites.schemas';
import type {
  GetRateHistoryUseCase,
  GetSiteRatesUseCase,
  SiteRatesView,
  UpdateSiteBandsUseCase,
  UpdateSiteRatesUseCase,
} from '../../application/site-rates.use-cases';
import type { Rate } from '../../domain/rate';
import {
  BandsSchema,
  RateSchema,
  SiteRatesSchema,
  UpdateBandsRequestSchema,
  UpdateRatesRequestSchema,
} from './rates.schemas';

const json = (schema: z.ZodType) => ({ 'application/json': { schema } });
const tags = [TAGS.rates.name];
const security = [{ bearerAuth: [] }];
const params = SiteIdParamsSchema;
const ADMIN_ERRORS = {
  401: 'Sin sesión (AUTH_REQUIRED) o sesión inválida.',
  403: 'El usuario no es administrador (FORBIDDEN).',
  404: 'No existe la sede (SITE_NOT_FOUND).',
};

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/sites/{id}/rates',
  tags,
  security,
  summary: 'Tarifas vigentes y franjas',
  description: 'Tarifas vigentes por tipo de vehículo y franja, y horas de inicio de cada franja. El empleado solo consulta su sede.',
  request: { params },
  responses: {
    200: { description: 'Tarifas y franjas de la sede.', content: json(SiteRatesSchema) },
    ...errorResponses({
      401: 'Sin sesión (AUTH_REQUIRED) o sesión inválida.',
      403: 'El empleado consulta otra sede (SITE_FORBIDDEN).',
      404: 'No existe la sede (SITE_NOT_FOUND).',
    }),
  },
});

openApiRegistry.registerPath({
  method: 'put',
  path: '/api/sites/{id}/rates',
  tags,
  security,
  summary: 'Actualizar tarifas',
  description:
    'Fija la tarifa diurna y nocturna de uno o varios tipos de vehículo. Rechaza una nocturna mayor o igual ' +
    'a la diurna (RN-02), salvo que ambas sean $0. Cada valor que cambia crea una versión nueva (RN-07). Solo administrador.',
  request: { params, body: { content: json(UpdateRatesRequestSchema) } },
  responses: {
    200: { description: 'Tarifas vigentes después del cambio.', content: json(SiteRatesSchema) },
    ...errorResponses({ 400: 'Datos inválidos (VALIDATION_ERROR) o regla RN-02 incumplida (RATE_RULE_VIOLATION).', ...ADMIN_ERRORS }),
  },
});

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/sites/{id}/rates/history',
  tags,
  security,
  summary: 'Historial de tarifas',
  description: 'Todas las versiones de tarifa de la sede, de la más reciente a la más antigua. Solo administrador.',
  request: { params },
  responses: {
    200: { description: 'Versiones de tarifa.', content: json(z.array(RateSchema)) },
    ...errorResponses(ADMIN_ERRORS),
  },
});

openApiRegistry.registerPath({
  method: 'patch',
  path: '/api/sites/{id}/bands',
  tags,
  security,
  summary: 'Cambiar franjas horarias',
  description: 'Cambia la hora de inicio de la franja diurna (y del día operativo) y de la nocturna. Solo administrador.',
  request: { params, body: { content: json(UpdateBandsRequestSchema) } },
  responses: {
    200: { description: 'Franjas actualizadas.', content: json(BandsSchema) },
    ...errorResponses({ 400: 'Formato de hora inválido (VALIDATION_ERROR) o diurna después de nocturna (BAND_ORDER_INVALID).', ...ADMIN_ERRORS }),
  },
});

function toRateResponse(rate: Rate): z.infer<typeof RateSchema> {
  return { ...rate, validFrom: rate.validFrom.toISOString(), validTo: rate.validTo?.toISOString() ?? null };
}

function toRatesResponse(view: SiteRatesView): z.infer<typeof SiteRatesSchema> {
  return { ...view, rates: view.rates.map(toRateResponse) };
}

export interface RatesUseCases {
  get: GetSiteRatesUseCase;
  history: GetRateHistoryUseCase;
  update: UpdateSiteRatesUseCase;
  updateBands: UpdateSiteBandsUseCase;
}

/** Rutas anidadas bajo /api/sites/:id. */
export function createRatesRouter(useCases: RatesUseCases, guards: AuthGuards): Router {
  const router = Router();
  const adminOnly = [guards.authenticate, guards.allow('ADMIN')];

  router.get('/:id/rates', guards.authenticate, async (req, res) => {
    const { id } = params.parse(req.params);
    res.json(toRatesResponse(await useCases.get.execute(currentUserOf(req), id)));
  });

  router.put('/:id/rates', ...adminOnly, async (req, res) => {
    const { id } = params.parse(req.params);
    const { rates } = UpdateRatesRequestSchema.parse(req.body);
    res.json(toRatesResponse(await useCases.update.execute(currentUserOf(req), id, rates)));
  });

  router.get('/:id/rates/history', ...adminOnly, async (req, res) => {
    const { id } = params.parse(req.params);
    res.json((await useCases.history.execute(id)).map(toRateResponse));
  });

  router.patch('/:id/bands', ...adminOnly, async (req, res) => {
    const { id } = params.parse(req.params);
    const bands = UpdateBandsRequestSchema.parse(req.body);
    res.json(await useCases.updateBands.execute(id, bands));
  });

  return router;
}
