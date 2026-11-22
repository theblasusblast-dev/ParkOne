import { PrismaClient } from '@prisma/client';

/**
 * Conexión única a la base de datos para toda la API. Solo los adaptadores
 * de infraestructura la importan; el dominio nunca conoce Prisma.
 */
export const prisma = new PrismaClient();
