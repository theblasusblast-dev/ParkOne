/**
 * Único punto de entrada a Zod en todo el backend.
 *
 * Zod define la forma esperada de los datos (por ejemplo, "placa: texto de 6
 * caracteres") y valida lo que llega a la API. zod-to-openapi le agrega el
 * método .openapi() para que esos mismos esquemas generen la documentación de
 * Swagger. Esa extensión debe activarse una sola vez y antes de crear cualquier
 * esquema; por eso todos los archivos importan `z` desde aquí y nunca desde
 * 'zod' directamente.
 */
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export { z };
