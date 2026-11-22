import { Router } from 'express';
import { errorResponses } from '../../../../infrastructure/openapi/common-schemas';
import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { TAGS } from '../../../../infrastructure/openapi/tags';
import { z } from '../../../../shared/zod';
import { currentUserOf, type AuthGuards } from '../../../auth/infrastructure/http/auth.guards';
import type { FindPendingChargesUseCase, PayChargeResult, PayChargeUseCase } from '../../application/billing.use-cases';
import {
  ChargeIdParamsSchema,
  ChargeSchema,
  PayChargeRequestSchema,
  PayChargeResultSchema,
  PendingChargesQuerySchema,
} from './billing.schemas';

const json = (schema: z.ZodType) => ({ 'application/json': { schema } });
const SESSION_ERRORS = {
  401: 'Sin sesión (AUTH_REQUIRED) o sesión inválida.',
  403: 'El empleado opera otra sede (SITE_FORBIDDEN).',
};

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/charges/pending',
  tags: [TAGS.billing.name],
  summary: 'Cobros pendientes de una placa',
  description: 'Busca los cobros pendientes de una placa en una sede, para cobrarlos en la caja.',
  security: [{ bearerAuth: [] }],
  request: { query: PendingChargesQuerySchema },
  responses: {
    200: { description: 'Cobros pendientes (lista vacía si no debe nada).', content: json(z.array(ChargeSchema)) },
    ...errorResponses({ 400: 'Faltan la sede o la placa (VALIDATION_ERROR).', ...SESSION_ERRORS }),
  },
});

openApiRegistry.registerPath({
  method: 'post',
  path: '/api/charges/{id}/payments',
  tags: [TAGS.billing.name],
  summary: 'Registrar pago en efectivo',
  description:
    'Registra el pago en efectivo de un cobro por su valor exacto. El cobro pasa a pagado y el vehículo ' +
    'queda con pase vigente hasta el fin del día operativo (RN-03). Repetir la misma referencia devuelve el ' +
    'mismo pago sin duplicarlo (idempotencia).',
  security: [{ bearerAuth: [] }],
  request: { params: ChargeIdParamsSchema, body: { content: json(PayChargeRequestSchema) } },
  responses: {
    201: { description: 'Pago registrado.', content: json(PayChargeResultSchema) },
    200: { description: 'La referencia ya existía: se devuelve el mismo pago (replayed: true).', content: json(PayChargeResultSchema) },
    ...errorResponses({
      400: 'Datos inválidos (VALIDATION_ERROR) o valor distinto al del cobro (AMOUNT_MISMATCH).',
      ...SESSION_ERRORS,
      404: 'No existe el cobro (CHARGE_NOT_FOUND).',
      409: 'Cobro ya pagado (CHARGE_ALREADY_PAID), anulado o vencido (CHARGE_NOT_PAYABLE), o referencia usada en otro cobro (REFERENCE_IN_USE).',
    }),
  },
});

function toPaymentResponse(result: PayChargeResult): z.infer<typeof PayChargeResultSchema> {
  return {
    payment: { ...result.payment, paidAt: result.payment.paidAt.toISOString() },
    charge: result.charge,
    passValidUntil: result.passValidUntil.toISOString(),
    replayed: result.replayed,
  };
}

export interface BillingUseCases {
  findPending: FindPendingChargesUseCase;
  pay: PayChargeUseCase;
}

export function createBillingRouter(useCases: BillingUseCases, guards: AuthGuards): Router {
  const router = Router();

  router.get('/pending', guards.authenticate, async (req, res) => {
    const { siteId, plate } = PendingChargesQuerySchema.parse(req.query);
    res.json(await useCases.findPending.execute(currentUserOf(req), siteId, plate));
  });

  router.post('/:id/payments', guards.authenticate, async (req, res) => {
    const { id } = ChargeIdParamsSchema.parse(req.params);
    const input = PayChargeRequestSchema.parse(req.body);
    const result = await useCases.pay.execute(currentUserOf(req), id, input);
    res.status(result.replayed ? 200 : 201).json(toPaymentResponse(result));
  });

  return router;
}
