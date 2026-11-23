import { Router } from 'express';
import { errorResponses } from '../../../../infrastructure/openapi/common-schemas';
import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { TAGS } from '../../../../infrastructure/openapi/tags';
import { z } from '../../../../shared/zod';
import { currentUserOf, type AuthGuards } from '../../../auth/infrastructure/http/auth.guards';
import type { HistoryQueries } from '../../application/history';
import {
  ChargeHistoryQuerySchema,
  ChargePageSchema,
  EventPageSchema,
  HistoryQuerySchema,
  PaymentPageSchema,
} from './history.schemas';

const json = (schema: z.ZodType) => ({ 'application/json': { schema } });
const ERRORS = errorResponses({
  400: 'Filtro inválido, por ejemplo una fecha que no existe (VALIDATION_ERROR), o rango invertido (INVALID_RANGE).',
  401: 'Sin sesión (AUTH_REQUIRED) o sesión inválida.',
  403: 'El empleado consulta otra sede (SITE_FORBIDDEN).',
  404: 'No existe la sede (SITE_NOT_FOUND).',
});

const register = (path: string, summary: string, description: string, query: z.ZodObject, page: z.ZodType) =>
  openApiRegistry.registerPath({
    method: 'get',
    path,
    tags: [TAGS.history.name],
    summary,
    description,
    security: [{ bearerAuth: [] }],
    request: { query },
    responses: { 200: { description: 'Resultados paginados, del más reciente al más antiguo.', content: json(page) }, ...ERRORS },
  });

register('/api/history/events', 'Historial de ingresos y salidas', 'Eventos del carril con filtros por placa y fechas (F-09).', HistoryQuerySchema, EventPageSchema);
register('/api/history/charges', 'Historial de cobros', 'Cobros con filtros por placa, fechas (día operativo), estado y franja.', ChargeHistoryQuerySchema, ChargePageSchema);
register('/api/history/payments', 'Historial de pagos', 'Pagos recibidos en la sede con filtros por placa y fechas.', HistoryQuerySchema, PaymentPageSchema);

const iso = (date: Date | null) => date?.toISOString() ?? null;

/** Quita los filtros vacíos para que el repositorio reciba solo los que se usaron. */
function clean<T extends object>(query: T): T {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== '')) as T;
}

export function createHistoryRouter(history: HistoryQueries, guards: AuthGuards): Router {
  const router = Router();
  router.use(guards.authenticate);

  router.get('/events', async (req, res) => {
    const page = await history.events(currentUserOf(req), clean(HistoryQuerySchema.parse(req.query)));
    res.json({ ...page, items: page.items.map((row) => ({ ...row, occurredAt: row.occurredAt.toISOString() })) });
  });

  router.get('/charges', async (req, res) => {
    const page = await history.charges(currentUserOf(req), clean(ChargeHistoryQuerySchema.parse(req.query)));
    res.json({ ...page, items: page.items.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), paidAt: iso(row.paidAt) })) });
  });

  router.get('/payments', async (req, res) => {
    const page = await history.payments(currentUserOf(req), clean(HistoryQuerySchema.parse(req.query)));
    res.json({ ...page, items: page.items.map((row) => ({ ...row, paidAt: row.paidAt.toISOString() })) });
  });

  return router;
}
