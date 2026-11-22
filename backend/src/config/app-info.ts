import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Datos públicos de la API. La versión se lee de package.json para no
 * repetirla en dos lugares. La ruta funciona igual desde src/config (en
 * desarrollo) y desde dist/config (compilado), porque ambas están a la misma
 * profundidad respecto de package.json.
 */
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8'),
) as { version: string };

export const APP_INFO = {
  name: 'ParkOne API',
  version: packageJson.version,
  description:
    'API del sistema de parqueadero ParkOne: lectura de placas, asignación de ' +
    'espacios, cobros por franja horaria, pagos y control de barrera en tiempo real.',
} as const;
