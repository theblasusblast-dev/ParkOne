import type { Role } from '../../../shared/domain/role';
import type { UserAccount } from '../domain/user-account';

/*
 * Puertos del módulo de autenticación: lo que la lógica necesita del mundo
 * exterior, sin decir cómo se resuelve. Las implementaciones (Prisma, bcrypt,
 * JWT) viven en infrastructure/ y se conectan en auth.module.ts.
 */

export interface UserAccountRepository {
  findByEmail(email: string): Promise<UserAccount | null>;
  findById(id: string): Promise<UserAccount | null>;
}

/**
 * Solo verifica contraseñas. Crear el hash es otra responsabilidad (la
 * necesitará la gestión de empleados), así que va en otro puerto: cada
 * consumidor depende solo de lo que usa.
 */
export interface PasswordVerifier {
  matches(plainPassword: string, passwordHash: string): Promise<boolean>;
}

/** Datos que viajan dentro del token de sesión. */
export interface SessionClaims {
  userId: string;
  role: Role;
  siteId: string | null;
}

export interface IssuedToken {
  token: string;
  expiresInSeconds: number;
}

export interface TokenService {
  issue(claims: SessionClaims): IssuedToken;
  /** Devuelve los datos del token, o null si es inválido o ya expiró. */
  read(token: string): SessionClaims | null;
}
