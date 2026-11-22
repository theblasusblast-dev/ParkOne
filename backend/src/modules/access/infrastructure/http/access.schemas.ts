import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { VEHICLE_TYPES } from '../../../../shared/domain/vehicle-type';
import { z } from '../../../../shared/zod';
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
