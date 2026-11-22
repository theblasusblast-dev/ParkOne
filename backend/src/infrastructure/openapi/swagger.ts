import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiDocument } from './document';

type SwaggerSpec = Parameters<typeof swaggerUi.setup>[0];

/**
 * Rutas de documentación:
 *   GET /docs               interfaz de Swagger UI
 *   GET /docs/openapi.json  especificación en JSON (útil para exportarla)
 */
export function createDocsRouter(): Router {
  const document = buildOpenApiDocument();
  const router = Router();

  router.get('/openapi.json', (_req, res) => {
    res.json(document);
  });

  router.use(
    '/',
    swaggerUi.serve,
    swaggerUi.setup(document as unknown as SwaggerSpec, {
      customSiteTitle: 'ParkOne API · Documentación',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        docExpansion: 'list',
        filter: true,
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    }),
  );

  return router;
}
