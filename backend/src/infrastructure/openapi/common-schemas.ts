import { z } from '../../shared/zod';
import { openApiRegistry } from './registry';

/**
 * Forma única de todas las respuestas de error de la API.
 * Ejemplo: { "error": { "code": "NOT_FOUND", "message": "..." } }
 */
export const ErrorResponseSchema = openApiRegistry.register(
  'ErrorResponse',
  z.object({
    error: z.object({
      code: z.string().openapi({
        description: 'Código del error, pensado para que el frontend lo interprete.',
        example: 'VALIDATION_ERROR',
      }),
      message: z.string().openapi({
        description: 'Explicación en español, lista para mostrar al usuario.',
        example: 'Los datos enviados no son válidos.',
      }),
      details: z.unknown().optional().openapi({
        description: 'Información adicional, por ejemplo qué campos fallaron.',
      }),
    }),
  }),
);

type ErrorStatus = 400 | 401 | 403 | 404 | 409;

/**
 * Respuestas de error para documentar un endpoint sin repetir el esquema:
 *   responses: { 200: {...}, ...errorResponses({ 401: 'Sin sesión.' }) }
 * Cada endpoint escribe su propia descripción, que es lo útil en Swagger.
 */
export function errorResponses(descriptions: Partial<Record<ErrorStatus, string>>) {
  return Object.fromEntries(
    Object.entries(descriptions).map(([status, description]) => [
      status,
      { description, content: { 'application/json': { schema: ErrorResponseSchema } } },
    ]),
  );
}
