import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../application/ports';

/** Rondas de bcrypt: más rondas, más lento de adivinar por fuerza bruta. */
const BCRYPT_ROUNDS = 10;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
  }
}
