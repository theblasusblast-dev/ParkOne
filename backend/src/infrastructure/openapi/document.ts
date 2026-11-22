import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { APP_INFO } from '../../config/app-info';
import { env } from '../../config/env';
import { openApiRegistry } from './registry';
import { TAG_LIST } from './tags';

// Importación sin nombres: carga el archivo solo para que registre los esquemas
// compartidos (ErrorResponse). TypeScript elimina los imports que se usan solo
// como tipos, así que este registro no puede depender de esos imports.
import './common-schemas';

/**
 * Construye el documento OpenAPI completo a partir de lo registrado.
 * Se llama al crear la app, cuando todos los archivos de rutas ya se cargaron
 * y registraron sus endpoints.
 */
export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(openApiRegistry.definitions);

  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: APP_INFO.name,
      version: APP_INFO.version,
      description: APP_INFO.description,
    },
    servers: [{ url: `http://localhost:${env.PORT}`, description: 'Entorno local' }],
    tags: [...TAG_LIST],
  });
}
