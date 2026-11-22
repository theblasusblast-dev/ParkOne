import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { BANDS } from '../../../../shared/domain/band';
import { CLOCK_TIME_PATTERN } from '../../../../shared/domain/clock-time';
import { VEHICLE_TYPES } from '../../../../shared/domain/vehicle-type';
import { z } from '../../../../shared/zod';

const amount = (label: string) =>
  z
    .number(`La tarifa ${label} es obligatoria.`)
    .int(`La tarifa ${label} debe ser un valor entero en pesos.`)
    .min(0, `La tarifa ${label} no puede ser negativa.`)
    .max(1_000_000, `La tarifa ${label} no puede superar $1.000.000.`);

export const UpdateRatesRequestSchema = openApiRegistry.register(
  'UpdateRatesRequest',
  z
    .object({
      rates: z
        .array(
          z.object({
            vehicleType: z.enum(VEHICLE_TYPES),
            dayAmountCop: amount('diurna').openapi({ example: 9000 }),
            nightAmountCop: amount('nocturna').openapi({ example: 6000 }),
          }),
        )
        .min(1, 'Envía al menos un tipo de vehículo.'),
    })
    .refine((body) => new Set(body.rates.map((rate) => rate.vehicleType)).size === body.rates.length, {
      message: 'Cada tipo de vehículo puede aparecer una sola vez.',
    })
    .openapi({ example: { rates: [{ vehicleType: 'CAR', dayAmountCop: 9000, nightAmountCop: 6000 }] } }),
);

const clockTime = (label: string) =>
  z.string().regex(CLOCK_TIME_PATTERN, `La hora de inicio ${label} debe tener el formato HH:MM (00:00 a 23:59).`);

export const UpdateBandsRequestSchema = openApiRegistry.register(
  'UpdateBandsRequest',
  z.object({
    dayBandStart: clockTime('diurna').openapi({ description: 'También es el inicio del día operativo.', example: '06:00' }),
    nightBandStart: clockTime('nocturna').openapi({ example: '18:00' }),
  }),
);

export const BandsSchema = openApiRegistry.register(
  'SiteBands',
  z.object({
    dayBandStart: z.string().openapi({ example: '06:00' }),
    nightBandStart: z.string().openapi({ example: '18:00' }),
  }),
);

export const RateSchema = openApiRegistry.register(
  'Rate',
  z.object({
    id: z.uuid(),
    vehicleType: z.enum(VEHICLE_TYPES).openapi({ example: 'CAR' }),
    band: z.enum(BANDS).openapi({ example: 'DAY' }),
    amountCop: z.number().int().openapi({ example: 8000 }),
    validFrom: z.string().openapi({ format: 'date-time' }),
    validTo: z.string().nullable().openapi({ format: 'date-time', description: 'null mientras la tarifa está vigente.' }),
  }),
);

export const SiteRatesSchema = openApiRegistry.register(
  'SiteRates',
  z.object({
    siteId: z.uuid(),
    dayBandStart: z.string().openapi({ example: '06:00' }),
    nightBandStart: z.string().openapi({ example: '18:00' }),
    rates: z.array(RateSchema),
  }),
);
