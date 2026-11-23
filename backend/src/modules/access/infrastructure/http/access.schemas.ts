import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { VEHICLE_TYPES } from '../../../../shared/domain/vehicle-type';
import { z } from '../../../../shared/zod';
import { ChargeSchema } from '../../../billing/infrastructure/http/billing.schemas';
import { MAX_READ_ATTEMPTS } from '../../application/read-plate.use-case';

export const PlateReadingRequestSchema = openApiRegistry.register(
  'PlateReadingRequest',
  z.object({
    text: z.string().trim().min(1, 'El texto leído es obligatorio.').max(15).openapi({
      description: 'Texto que leyó la cámara (simulada). Puede traer espacios, guiones o minúsculas.',
      example: 'abc 123',
    }),
    region: z.string().trim().max(40).default('').openapi({
      description: 'Texto inferior de la placa: "COLOMBIA" en motos, el municipio en carros.',
      example: 'MANIZALES',
    }),
    confidence: z.number().min(0).max(1).openapi({ description: 'Confianza de la lectura, de 0 a 1.', example: 0.95 }),
    attempt: z.number().int().min(1).max(MAX_READ_ATTEMPTS).default(1).openapi({ example: 1 }),
  }),
);

export const PlateReadingResponseSchema = openApiRegistry.register(
  'PlateReadingResponse',
  z.object({
    outcome: z.enum(['ACCEPTED', 'RETRY', 'MANUAL_REVIEW']).openapi({
      description: 'ACCEPTED: continuar con el ingreso · RETRY: leer otra vez · MANUAL_REVIEW: llamar al empleado.',
      example: 'ACCEPTED',
    }),
    plate: z.string().nullable().openapi({ example: 'ABC123' }),
    vehicleType: z.enum(VEHICLE_TYPES).nullable().openapi({ example: 'CAR' }),
    attempt: z.number().int().openapi({ example: 1 }),
    maxAttempts: z.number().int().openapi({ example: MAX_READ_ATTEMPTS }),
    message: z.string().openapi({ example: 'Placa ABC123 reconocida (carro).' }),
  }),
);

export const EntryRequestSchema = openApiRegistry.register(
  'EntryRequest',
  z.object({
    siteId: z.uuid('El id de la sede no es válido.'),
    plate: z.string().trim().toUpperCase().min(5, 'La placa debe tener al menos 5 caracteres.').max(10).openapi({ example: 'ABC123' }),
    vehicleType: z.enum(VEHICLE_TYPES).openapi({ example: 'CAR' }),
    confidence: z.number().min(0).max(1).nullable().default(null).openapi({ example: 0.95 }),
    region: z.string().trim().max(40).nullable().default(null).openapi({ example: 'MANIZALES' }),
  }),
);

export const EntryResultSchema = openApiRegistry.register(
  'EntryResult',
  z.object({
    eventId: z.uuid(),
    outcome: z.enum(['ADMITTED', 'FULL', 'ALREADY_INSIDE']).openapi({
      description: 'ADMITTED: entra · FULL: no hay cupo (LLENO) · ALREADY_INSIDE: la placa ya está adentro (anti-passback).',
      example: 'ADMITTED',
    }),
    barrierOpened: z.boolean().openapi({ example: true }),
    message: z.string().openapi({ example: 'Bienvenido. Diríjase al espacio C-01. Cobro diurno: $8.000.' }),
    plate: z.string().openapi({ example: 'ABC123' }),
    vehicleType: z.enum(VEHICLE_TYPES),
    spot: z.object({ id: z.uuid(), code: z.string().openapi({ example: 'C-01' }) }).nullable(),
    charge: ChargeSchema.nullable().openapi({ description: 'Cobro del día operativo; null si no aplica (moto con tarifa $0).' }),
    reentry: z.boolean().openapi({ description: 'true si ya tenía cobro hoy: reingreso sin cobro nuevo (RN-03).', example: false }),
  }),
);

export const ManualEntryRequestSchema = openApiRegistry.register(
  'ManualEntryRequest',
  z.object({
    siteId: z.uuid('El id de la sede no es válido.'),
    plate: z.string().trim().min(1, 'La placa es obligatoria.').max(15).openapi({
      description: 'Placa digitada o corregida por el empleado.',
      example: 'ABC123',
    }),
    vehicleType: z.enum(VEHICLE_TYPES).openapi({ description: 'Tipo elegido por el empleado.', example: 'CAR' }),
    foreignPlate: z.boolean().default(false).openapi({
      description: 'true para placas extranjeras: no se valida el formato colombiano.',
      example: false,
    }),
  }),
);
