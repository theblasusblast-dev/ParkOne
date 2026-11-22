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
