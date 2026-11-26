// Carga el archivo .env antes que cualquier otra cosa.
import 'dotenv/config';
import { APP_INFO } from './config/app-info';
import { env } from './config/env';
import { InMemoryEventBus } from './infrastructure/events/in-memory-event-bus';
import { createApp } from './infrastructure/http/app';
import { attachRealtime } from './infrastructure/realtime/realtime';

/**
 * Punto de arranque de la API (raíz de composición). Aquí se construye la
 * aplicación y se pone a escuchar; en los siguientes bloques también se
 * conectarán aquí los repositorios y servicios de cada módulo.
 */
const events = new InMemoryEventBus();
const app = createApp(events);

// En Express 5 este callback también se llama cuando el arranque falla (con el
// error como argumento); en ese caso el manejador 'error' de abajo informa la causa.
const server = app.listen(env.PORT, (error?: Error) => {
  if (error) return;
  console.log(`${APP_INFO.name} v${APP_INFO.version} escuchando en http://localhost:${env.PORT}`);
  console.log(`Documentación: http://localhost:${env.PORT}/docs`);
  console.log(`Monitor de barrera: http://localhost:${env.PORT}/monitor?siteId=<id de la sede>`);
});

attachRealtime(server, events, env.CORS_ORIGIN);

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${env.PORT} ya está en uso. Cierra el otro proceso o cambia PORT en backend/.env.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});
