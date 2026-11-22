import cors from 'cors';
import express, { type Express } from 'express';
import { env } from '../../config/env';
import { createAuthModule } from '../../modules/auth/auth.module';
import { createSitesModule } from '../../modules/sites/sites.module';
import { createDocsRouter } from '../openapi/swagger';
import { errorHandler, notFoundHandler } from './error-handler';
import { systemRouter } from './system.routes';

/**
 * Arma la aplicación Express: middlewares, módulos, documentación y manejo de
 * errores, en ese orden. Es la raíz de composición: aquí se crean los módulos
 * y se les pasan sus dependencias (por ejemplo, las guardias de sesión).
 * Los archivos de rutas se importan arriba, así que cuando se construye la
 * documentación ya registraron todos sus endpoints.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  const auth = createAuthModule();
  const sites = createSitesModule(auth.guards);

  app.get('/', (_req, res) => {
    res.redirect('/docs');
  });
  app.use('/api', systemRouter);
  app.use('/api/auth', auth.router);
  app.use('/api/sites', sites.router);
  app.use('/docs', createDocsRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
