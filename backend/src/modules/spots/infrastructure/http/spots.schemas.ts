import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { BANDS } from '../../../../shared/domain/band';
import { SPOT_STATUSES } from '../../../../shared/domain/spot-status';
import { VEHICLE_TYPES } from '../../../../shared/domain/vehicle-type';
import { z } from '../../../../shared/zod';
import { CHARGE_STATUSES } from '../../../billing/domain/charge';

export const SpotMapQuerySchema = z.object({
  status: z.enum(SPOT_STATUSES).optional().openapi({ description: 'FREE (gris), OCCUPIED (verde) o DISABLED (rojo).' }),
  vehicleType: z.enum(VEHICLE_TYPES).optional(),
  plate: z.string().trim().max(10).optional().openapi({ description: 'Busca la placa (o parte de ella) entre los espacios ocupados.' }),
});

export const SpotSchema = openApiRegistry.register(
  'Spot',
  z.object({
    id: z.uuid(),
    code: z.string().openapi({ example: 'C-07' }),
    vehicleType: z.enum(VEHICLE_TYPES).openapi({ example: 'CAR' }),
    status: z.enum(SPOT_STATUSES).openapi({ example: 'OCCUPIED' }),
    disabledReason: z.string().nullable().openapi({ description: 'Motivo, si está inhabilitado.', example: null }),
    occupant: z
      .object({
        plate: z.string().openapi({ example: 'ABC123' }),
        since: z.string().openapi({ format: 'date-time' }),
        minutesParked: z.number().int().openapi({ description: 'Tiempo en uso, en minutos.', example: 95 }),
        charge: z
          .object({
            amountCop: z.number().int().openapi({ example: 8000 }),
            band: z.enum(BANDS).openapi({ example: 'DAY' }),
            status: z.enum(CHARGE_STATUSES).openapi({ example: 'PENDING' }),
          })
          .nullable()
          .openapi({ description: 'Último cobro de la placa en la sede; null si no paga (moto).' }),
      })
      .nullable()
      .openapi({ description: 'Quién ocupa el espacio; null si está libre o inhabilitado.' }),
  }),
);

export const SpotIdParamsSchema = z.object({
  id: z.uuid('El id del espacio no es válido.'),
});

export const ChangeSpotStatusRequestSchema = openApiRegistry.register(
  'ChangeSpotStatusRequest',
  z.object({
    status: z.enum(['FREE', 'DISABLED']).openapi({ description: 'DISABLED para inhabilitar, FREE para volver a habilitar.', example: 'DISABLED' }),
    reason: z.string().trim().min(3, 'El motivo debe tener al menos 3 caracteres.').max(200).nullable().default(null).openapi({
      description: 'Obligatorio al inhabilitar.',
      example: 'Mantenimiento de la demarcación',
    }),
  }),
);
