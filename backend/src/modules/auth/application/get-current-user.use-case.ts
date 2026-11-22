import { AppError } from '../../../shared/app-error';
import type { UserAccount } from '../domain/user-account';
import type { UserAccountRepository } from './ports';

/**
 * Obtiene el usuario de una sesión. Se consulta en cada petición protegida,
 * así un empleado desactivado o con otra sede deja de operar de inmediato,
 * aunque su token todavía no haya expirado.
 */
export class GetCurrentUserUseCase {
  constructor(private readonly users: UserAccountRepository) {}

  async execute(userId: string): Promise<UserAccount> {
    const account = await this.users.findById(userId);
    if (!account || !account.active) {
      throw new AppError(401, 'INVALID_SESSION', 'La sesión ya no es válida. Inicia sesión de nuevo.');
    }
    return account;
  }
}
