import { env } from '../../config/env';
import { prisma } from '../../infrastructure/persistence/prisma';
import { GetCurrentUserUseCase } from './application/get-current-user.use-case';
import { LoginUseCase } from './application/login.use-case';
import { BcryptPasswordVerifier } from './infrastructure/bcrypt-password-verifier';
import { createAuthGuards } from './infrastructure/http/auth.guards';
import { createAuthRouter } from './infrastructure/http/auth.routes';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { PrismaUserAccountRepository } from './infrastructure/prisma-user-account.repository';

/**
 * Ensambla el módulo: aquí, y solo aquí, se decide qué implementación
 * concreta recibe cada puerto. Cambiar Prisma o JWT por otra tecnología
 * solo toca este archivo y el adaptador nuevo.
 */
export function createAuthModule() {
  const users = new PrismaUserAccountRepository(prisma);
  const tokens = new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_HOURS * 3600);

  const guards = createAuthGuards(tokens, new GetCurrentUserUseCase(users));
  const login = new LoginUseCase(users, new BcryptPasswordVerifier(), tokens);

  return {
    router: createAuthRouter(login, guards),
    guards,
  };
}
