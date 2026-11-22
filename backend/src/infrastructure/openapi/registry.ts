import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

/**
 * Registro central de la documentación OpenAPI.
 *
 * Cada archivo de rutas registra aquí sus endpoints y esquemas junto al código
 * que los implementa. Así la documentación no se escribe aparte y no puede
 * quedar desactualizada respecto de lo que la API realmente hace.
 */
export const openApiRegistry = new OpenAPIRegistry();

// Botón "Authorize" de Swagger: los endpoints protegidos piden un token JWT
// en el encabezado Authorization: Bearer <token>.
openApiRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Token JWT obtenido al iniciar sesión.',
});
