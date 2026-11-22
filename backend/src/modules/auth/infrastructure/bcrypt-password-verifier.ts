import bcrypt from 'bcryptjs';
import type { PasswordVerifier } from '../application/ports';

/** Compara una contraseña con su hash bcrypt (el mismo algoritmo del seed). */
export class BcryptPasswordVerifier implements PasswordVerifier {
  matches(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}
