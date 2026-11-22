import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { ROLES } from '../../../../shared/domain/role';
import { z } from '../../../../shared/zod';

/*
 * Esquemas de entrada y salida del módulo. Cada uno valida en tiempo de
 * ejecución, tipa el código y aparece en Swagger: una sola definición.
 */

export const LoginRequestSchema = openApiRegistry.register(
  'LoginRequest',
  z.object({
    email: z.email('Escribe un correo válido.').openapi({ example: 'admin@parkone.co' }),
    password: z.string().min(1, 'La contraseña es obligatoria.').openapi({ example: 'Admin123*' }),
  }),
);

export const UserProfileSchema = openApiRegistry.register(
  'UserProfile',
  z.object({
    id: z.uuid().openapi({ example: '3f2b8c1e-5a7d-4e2b-9c1f-1a2b3c4d5e6f' }),
    fullName: z.string().openapi({ example: 'Administrador ParkOne' }),
    email: z.email().openapi({ example: 'admin@parkone.co' }),
    role: z.enum(ROLES).openapi({
      description: 'ADMIN: administrador del sistema · EMPLOYEE: empleado de una sede.',
      example: 'ADMIN',
    }),
    site: z
      .object({
        id: z.uuid(),
        name: z.string().openapi({ example: 'ParkOne Centro' }),
      })
      .nullable()
      .openapi({ description: 'Sede asignada al empleado; null para el administrador.' }),
  }),
);

export const LoginResponseSchema = openApiRegistry.register(
  'LoginResponse',
  z.object({
    token: z.string().openapi({
      description: 'Token JWT. En Swagger se pega en el botón Authorize (sin la palabra Bearer).',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    tokenType: z.literal('Bearer').openapi({ example: 'Bearer' }),
    expiresInSeconds: z.number().int().openapi({
      description: 'Segundos de validez del token.',
      example: 28800,
    }),
    user: UserProfileSchema,
  }),
);
