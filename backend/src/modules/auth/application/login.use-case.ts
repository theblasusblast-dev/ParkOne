import { AppError } from '../../../shared/app-error';
import { normalizeEmail, toPublicProfile, type PublicProfile } from '../domain/user-account';
import type { PasswordVerifier, TokenService, UserAccountRepository } from './ports';

export interface LoginResult {
  token: string;
  expiresInSeconds: number;
  user: PublicProfile;
}

/** Inicia sesión: verifica las credenciales y emite el token. */
export class LoginUseCase {
  constructor(
    private readonly users: UserAccountRepository,
    private readonly passwords: PasswordVerifier,
    private readonly tokens: TokenService,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const account = await this.users.findByEmail(normalizeEmail(email));
    const passwordOk = account !== null && (await this.passwords.matches(password, account.passwordHash));

    // El mismo mensaje sirve para "el correo no existe" y "la contraseña falla",
    // así nadie puede averiguar qué correos están registrados.
    if (!account || !passwordOk) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.');
    }

    // Solo se informa la desactivación a quien ya demostró conocer la contraseña.
    if (!account.active) {
      throw new AppError(401, 'ACCOUNT_DISABLED', 'Tu cuenta está desactivada. Contacta al administrador.');
    }

    const issued = this.tokens.issue({
      userId: account.id,
      role: account.role,
      siteId: account.site?.id ?? null,
    });

    return {
      token: issued.token,
      expiresInSeconds: issued.expiresInSeconds,
      user: toPublicProfile(account),
    };
  }
}
