import { z } from '../shared/zod';

/**
 * Variables de entorno validadas al arrancar.
 *
 * Si falta una variable o tiene un formato inválido, la API se detiene de
 * inmediato con un mensaje claro, en lugar de fallar después en un lugar
 * difícil de rastrear. Toda la configuración se lee de aquí y en ningún otro
 * archivo se usa process.env directamente.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:4200'),
  DATABASE_URL: z
    .string()
    .startsWith('postgresql://', 'Debe ser una cadena de conexión de PostgreSQL'),
  JWT_SECRET: z.string().min(32, 'Debe tener al menos 32 caracteres'),
  JWT_EXPIRES_HOURS: z.coerce.number().int().min(1).max(72).default(8),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error(`Variables de entorno inválidas:\n${problems}`);
  process.exit(1);
}

export const env = parsed.data;
