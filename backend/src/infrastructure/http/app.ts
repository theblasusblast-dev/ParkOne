import cors from 'cors';
import express, { type Express } from 'express';
import { env } from '../../config/env';
import { createDocsRouter } from '../openapi/swagger';
import { errorHandler, notFoundHandler } from './error-handler';
import { systemRouter } from './system.routes';

/**
 * Arma la aplicación Express: middlewares, rutas, documentación y manejo de
 * errores, en ese orden. Los archivos de rutas se importan arriba, así que
 * cuando se construye la documentación ya registraron todos sus endpoints.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.redirect('/docs');
  });
  app.use('/api', systemRouter);
  app.use('/docs', createDocsRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
