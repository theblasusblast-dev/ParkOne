import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { z } from '../../../../shared/zod';

/** Máximo de espacios por tipo en una sede: suficiente para el MVP y para el mapa. */
const MAX_SPOTS_PER_TYPE = 200;

const spotCount = (label: string) =>
  z
    .number(`El número de espacios de ${label} es obligatorio.`)
    .int(`El número de espacios de ${label} debe ser entero.`)
    .min(0, `El número de espacios de ${label} no puede ser negativo.`)
    .max(MAX_SPOTS_PER_TYPE, `Máximo ${MAX_SPOTS_PER_TYPE} espacios de ${label} por sede.`);

export const CreateSiteRequestSchema = openApiRegistry.register(
  'CreateSiteRequest',
  z.object({
    name: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.').max(60).openapi({
      example: 'ParkOne Norte',
    }),
    department: z.string().trim().min(2, 'Indica el departamento.').max(60).openapi({ example: 'Caldas' }),
    city: z.string().trim().min(2, 'Indica la ciudad o municipio.').max(60).openapi({ example: 'Manizales' }),
    carSpots: spotCount('carro').openapi({ description: 'Espacios de carro (se nombran C-01, C-02…).', example: 10 }),
    motorcycleSpots: spotCount('moto').openapi({ description: 'Espacios de moto (se nombran M-01, M-02…).', example: 6 }),
  }),
);

const SpotCountsSchema = openApiRegistry.register(
  'SpotCounts',
  z.object({
    total: z.number().int().openapi({ example: 10 }),
    free: z.number().int().openapi({ description: 'Libres (gris en el mapa).', example: 7 }),
    occupied: z.number().int().openapi({ description: 'Ocupados (verde en el mapa).', example: 2 }),
    disabled: z.number().int().openapi({ description: 'Inhabilitados (rojo en el mapa).', example: 1 }),
  }),
);

export const SiteSchema = openApiRegistry.register(
  'Site',
  z.object({
    id: z.uuid().openapi({ example: '7c9e6679-7425-40de-944b-e07fc1f90ae7' }),
    name: z.string().openapi({ example: 'ParkOne Norte' }),
    department: z.string().openapi({ example: 'Caldas' }),
    city: z.string().openapi({ example: 'Manizales' }),
    dayBandStart: z.string().openapi({ description: 'Inicio de la franja diurna y del día operativo.', example: '06:00' }),
    nightBandStart: z.string().openapi({ description: 'Inicio de la franja nocturna.', example: '18:00' }),
    active: z.boolean().openapi({ example: true }),
    capacity: z.object({ CAR: SpotCountsSchema, MOTORCYCLE: SpotCountsSchema }).openapi({
      description: 'Espacios por tipo de vehículo y estado.',
    }),
  }),
);

export const SiteIdParamsSchema = z.object({
  id: z.uuid('El id de la sede no es válido.').openapi({
    param: { name: 'id', in: 'path' },
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  }),
});
