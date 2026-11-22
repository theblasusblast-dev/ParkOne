/**
 * Tipos de vehículo que maneja el negocio. Es un tipo del dominio: no depende
 * de Prisma, aunque sus valores coinciden con el enum de la base de datos.
 * Agregar un tipo (por ejemplo bicicleta) empieza por esta lista.
 */
export const VEHICLE_TYPES = ['CAR', 'MOTORCYCLE'] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];
