// Carga el archivo .env antes que cualquier otra cosa.
import 'dotenv/config';
import { APP_INFO } from './config/app-info';
import { env } from './config/env';
import { createApp } from './infrastructure/http/app';

/**
 * Punto de arranque de la API (raíz de composición). Aquí se construye la
 * aplicación y se pone a escuchar; en los siguientes bloques también se
 * conectarán aquí los repositorios y servicios de cada módulo.
 */
const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`${APP_INFO.name} v${APP_INFO.version} escuchando en http://localhost:${env.PORT}`);
  console.log(`Documentación: http://localhost:${env.PORT}/docs`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${env.PORT} ya está en uso. Cierra el otro proceso o cambia PORT en backend/.env.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});
