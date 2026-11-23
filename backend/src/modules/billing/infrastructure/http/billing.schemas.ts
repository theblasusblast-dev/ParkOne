import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { BANDS } from '../../../../shared/domain/band';
import { z } from '../../../../shared/zod';
import { CHARGE_STATUSES } from '../../domain/charge';

export const ChargeSchema = openApiRegistry.register(
  'Charge',
  z.object({
    id: z.uuid(),
    plate: z.string().openapi({ example: 'ABC123' }),
    operatingDay: z.string().openapi({ description: 'Día operativo (06:00 a 05:59), AAAA-MM-DD.', example: '2026-11-22' }),
    band: z.enum(BANDS).openapi({ example: 'DAY' }),
    amountCop: z.number().int().openapi({ example: 8000 }),
    status: z.enum(CHARGE_STATUSES).openapi({ example: 'PENDING' }),
  }),
);

export const PendingChargesQuerySchema = z.object({
  siteId: z.uuid('El id de la sede no es válido.'),
  plate: z.string().trim().min(1, 'La placa es obligatoria.').max(15).openapi({ example: 'ABC123' }),
});

export const ChargeIdParamsSchema = z.object({
  id: z.uuid('El id del cobro no es válido.'),
});

export const PayChargeRequestSchema = openApiRegistry.register(
  'PayChargeRequest',
  z.object({
    amountCop: z.number().int().positive().openapi({ description: 'Debe ser igual al valor del cobro.', example: 8000 }),
    reference: z.string().trim().min(4).max(64).openapi({
      description: 'Referencia única del pago. Si se envía dos veces la misma, no se cobra dos veces.',
      example: 'CAJA-0001',
    }),
  }),
);

export const PayChargeResultSchema = openApiRegistry.register(
  'PayChargeResult',
  z.object({
    payment: z.object({
      id: z.uuid(),
      chargeId: z.uuid(),
      amountCop: z.number().int().openapi({ example: 8000 }),
      reference: z.string().openapi({ example: 'CAJA-0001' }),
      paidAt: z.string().openapi({ format: 'date-time' }),
      receivedBy: z.object({ id: z.uuid(), fullName: z.string().openapi({ example: 'Empleado Centro' }) }),
    }),
    charge: ChargeSchema,
    passValidUntil: z.string().openapi({
      format: 'date-time',
      description: 'Fin del día operativo: hasta entonces puede salir y reingresar sin pagar (RN-03).',
    }),
    replayed: z.boolean().openapi({ description: 'true si la referencia ya existía y se devolvió el mismo pago.', example: false }),
  }),
);
