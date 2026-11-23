import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { BANDS } from '../../../../shared/domain/band';
import { VEHICLE_TYPES } from '../../../../shared/domain/vehicle-type';
import { z } from '../../../../shared/zod';
import { CHARGE_STATUSES } from '../../../billing/domain/charge';

/** Día en formato AAAA-MM-DD que además exista en el calendario (rechaza 2026-13-40). */
const day = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `La fecha ${label} debe tener el formato AAAA-MM-DD.`)
    .refine((value) => {
      const date = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
    }, `La fecha ${label} no existe.`)
    .optional();

export const HistoryQuerySchema = z.object({
  siteId: z.uuid('El id de la sede no es válido.'),
  plate: z.string().trim().max(10).optional().openapi({ description: 'Placa o parte de ella.', example: 'ABC' }),
  from: day('inicial').openapi({ description: 'Desde este día (hora de Bogotá), incluido.', example: '2026-11-22' }),
  to: day('final').openapi({ description: 'Hasta este día (hora de Bogotá), incluido.', example: '2026-11-23' }),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const ChargeHistoryQuerySchema = HistoryQuerySchema.extend({
  status: z.enum(CHARGE_STATUSES).optional(),
  band: z.enum(BANDS).optional().openapi({ description: 'DAY (diurno) o NIGHT (nocturno).' }),
});

const paged = <T extends z.ZodType>(name: string, item: T) =>
  openApiRegistry.register(
    name,
    z.object({
      items: z.array(item),
      page: z.number().int().openapi({ example: 1 }),
      pageSize: z.number().int().openapi({ example: 20 }),
      total: z.number().int().openapi({ description: 'Total de resultados con estos filtros.', example: 42 }),
    }),
  );

export const EventPageSchema = paged(
  'AccessEventPage',
  z.object({
    id: z.uuid(),
    occurredAt: z.string().openapi({ format: 'date-time' }),
    direction: z.enum(['ENTRY', 'EXIT']),
    plate: z.string().openapi({ example: 'ABC123' }),
    vehicleType: z.enum(VEHICLE_TYPES),
    barrierOpened: z.boolean(),
    decisionReason: z.string().openapi({ example: 'Bienvenido. Diríjase al espacio C-01.' }),
    manualRead: z.boolean(),
    foreignPlate: z.boolean(),
    confidence: z.number().nullable(),
    spotCode: z.string().nullable().openapi({ example: 'C-01' }),
    operatorName: z.string().nullable().openapi({ description: 'Empleado que digitó la placa, si fue manual.' }),
  }),
);

export const ChargePageSchema = paged(
  'ChargeHistoryPage',
  z.object({
    id: z.uuid(),
    plate: z.string(),
    vehicleType: z.enum(VEHICLE_TYPES),
    operatingDay: z.string().openapi({ example: '2026-11-22' }),
    band: z.enum(BANDS),
    amountCop: z.number().int(),
    status: z.enum(CHARGE_STATUSES),
    createdAt: z.string().openapi({ format: 'date-time' }),
    paidAt: z.string().nullable().openapi({ format: 'date-time' }),
  }),
);

export const PaymentPageSchema = paged(
  'PaymentHistoryPage',
  z.object({
    id: z.uuid(),
    paidAt: z.string().openapi({ format: 'date-time' }),
    amountCop: z.number().int(),
    reference: z.string(),
    plate: z.string(),
    band: z.enum(BANDS),
    receivedByName: z.string().openapi({ example: 'Empleado Centro' }),
  }),
);
