import { Router } from 'express';
import { errorResponses } from '../../../../infrastructure/openapi/common-schemas';
import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { TAGS } from '../../../../infrastructure/openapi/tags';
import { z } from '../../../../shared/zod';
import type { LoginUseCase } from '../../application/login.use-case';
import { currentUserOf, type AuthGuards } from './auth.guards';
import { LoginRequestSchema, LoginResponseSchema, UserProfileSchema } from './auth.schemas';

openApiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: [TAGS.auth.name],
  summary: 'Iniciar sesión',
  description:
    'Verifica correo y contraseña y devuelve un token JWT válido por 8 horas. ' +
    'Copia el valor de `token` y pégalo en el botón **Authorize** para usar los endpoints protegidos.',
  request: {
    body: { content: { 'application/json': { schema: LoginRequestSchema } } },
  },
  responses: {
    200: {
      description: 'Sesión iniciada.',
      content: { 'application/json': { schema: LoginResponseSchema } },
    },
    ...errorResponses({
      400: 'Correo con formato inválido o contraseña vacía (VALIDATION_ERROR).',
      401: 'Correo o contraseña incorrectos (INVALID_CREDENTIALS) o cuenta desactivada (ACCOUNT_DISABLED).',
    }),
  },
});

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: [TAGS.auth.name],
  summary: 'Usuario de la sesión actual',
  description: 'Devuelve los datos del usuario dueño del token. Requiere Authorize.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Datos del usuario autenticado.',
      content: { 'application/json': { schema: UserProfileSchema } },
    },
    ...errorResponses({
      401: 'Sin token (AUTH_REQUIRED), token inválido o expirado (INVALID_TOKEN) o usuario desactivado (INVALID_SESSION).',
    }),
  },
});

/** Adaptador HTTP del módulo: traduce peticiones a casos de uso y nada más. */
export function createAuthRouter(login: LoginUseCase, guards: AuthGuards): Router {
  const router = Router();

  router.post('/login', async (req, res) => {
    const { email, password } = LoginRequestSchema.parse(req.body);
    const result = await login.execute(email, password);

    const body: z.infer<typeof LoginResponseSchema> = {
      token: result.token,
      tokenType: 'Bearer',
      expiresInSeconds: result.expiresInSeconds,
      user: result.user,
    };
    res.json(body);
  });

  router.get('/me', guards.authenticate, (req, res) => {
    const body: z.infer<typeof UserProfileSchema> = currentUserOf(req);
    res.json(body);
  });

  return router;
}
