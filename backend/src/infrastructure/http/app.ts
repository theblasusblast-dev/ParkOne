import cors from 'cors';
import express, { type Express } from 'express';
import { env } from '../../config/env';
import { createAccessModule } from '../../modules/access/access.module';
import { createAuthModule } from '../../modules/auth/auth.module';
import { createBillingModule } from '../../modules/billing/billing.module';
import { createEmployeesModule } from '../../modules/employees/employees.module';
import { createRatesModule } from '../../modules/rates/rates.module';
import { createSitesModule } from '../../modules/sites/sites.module';
import { InMemoryEventBus } from '../events/in-memory-event-bus';
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

  const events = new InMemoryEventBus();
  const auth = createAuthModule();
  const sites = createSitesModule(auth.guards);
  const employees = createEmployeesModule(auth.guards);
  const rates = createRatesModule(auth.guards);
  const access = createAccessModule(auth.guards);
  const billing = createBillingModule(auth.guards, events);

  app.get('/', (_req, res) => {
    res.redirect('/docs');
  });
  app.use('/api', systemRouter);
  app.use('/api/auth', auth.router);
  app.use('/api/sites', sites.router, rates.router);
  app.use('/api/access', access.router);
  app.use('/api/charges', billing.router);
  app.use('/api/employees', employees.router);
  app.use('/docs', createDocsRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
