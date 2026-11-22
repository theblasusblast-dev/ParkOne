import { Router } from 'express';
import { APP_INFO } from '../../config/app-info';
import { z } from '../../shared/zod';
import { openApiRegistry } from '../openapi/registry';
import { TAGS } from '../openapi/tags';
import { prisma } from '../persistence/prisma';

const HealthResponseSchema = openApiRegistry.register(
  'HealthResponse',
  z.object({
    status: z.enum(['ok', 'degraded']).openapi({
      description: '"ok" si todo funciona; "degraded" si la base de datos no responde.',
      example: 'ok',
    }),
    service: z.string().openapi({ example: 'ParkOne API' }),
    version: z.string().openapi({ example: '0.1.0' }),
    database: z.enum(['up', 'down']).openapi({
      description: 'Estado de la conexión con PostgreSQL.',
      example: 'up',
    }),
    uptimeSeconds: z.number().int().openapi({
      description: 'Segundos que lleva la API encendida.',
      example: 42,
    }),
    timestamp: z.string().openapi({
      description: 'Fecha y hora del servidor en UTC (ISO 8601).',
      format: 'date-time',
      example: '2026-11-22T15:30:00.000Z',
    }),
  }),
);

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/health',
  tags: [TAGS.system.name],
  summary: 'Estado del servicio',
  description:
    'Confirma que la API está en línea y que puede hablar con la base de datos. ' +
    'No requiere autenticación.',
  responses: {
    200: {
      description: 'La API y la base de datos funcionan.',
      content: { 'application/json': { schema: HealthResponseSchema } },
    },
    503: {
      description: 'La API responde, pero la base de datos no está disponible.',
      content: { 'application/json': { schema: HealthResponseSchema } },
    },
  },
});

/** Hace una consulta mínima para saber si PostgreSQL responde. */
async function isDatabaseUp(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export const systemRouter = Router();

systemRouter.get('/health', async (_req, res) => {
  const databaseUp = await isDatabaseUp();
  const body: z.infer<typeof HealthResponseSchema> = {
    status: databaseUp ? 'ok' : 'degraded',
    service: APP_INFO.name,
    version: APP_INFO.version,
    database: databaseUp ? 'up' : 'down',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
  res.status(databaseUp ? 200 : 503).json(body);
});
