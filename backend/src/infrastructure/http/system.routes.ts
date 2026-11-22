import { Router } from 'express';
import { APP_INFO } from '../../config/app-info';
import { z } from '../../shared/zod';
import { openApiRegistry } from '../openapi/registry';
import { TAGS } from '../openapi/tags';

const HealthResponseSchema = openApiRegistry.register(
  'HealthResponse',
  z.object({
    status: z.literal('ok').openapi({ example: 'ok' }),
    service: z.string().openapi({ example: 'ParkOne API' }),
    version: z.string().openapi({ example: '0.1.0' }),
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
  description: 'Confirma que la API está en línea. No requiere autenticación.',
  responses: {
    200: {
      description: 'La API está funcionando.',
      content: { 'application/json': { schema: HealthResponseSchema } },
    },
  },
});

export const systemRouter = Router();

systemRouter.get('/health', (_req, res) => {
  const body: z.infer<typeof HealthResponseSchema> = {
    status: 'ok',
    service: APP_INFO.name,
    version: APP_INFO.version,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
  res.json(body);
});
