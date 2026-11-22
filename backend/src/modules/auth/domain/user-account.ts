import type { Role } from '../../../shared/domain/role';

/** Cuenta de usuario tal como la necesita el módulo de autenticación. */
export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  active: boolean;
  passwordHash: string;
  /** Sede asignada; null para el administrador. */
  site: { id: string; name: string } | null;
}

/** Lo que sí puede salir de la API sobre un usuario: nunca el hash. */
export type PublicProfile = Omit<UserAccount, 'passwordHash' | 'active'>;

export function toPublicProfile(account: UserAccount): PublicProfile {
  return {
    id: account.id,
    fullName: account.fullName,
    email: account.email,
    role: account.role,
    site: account.site,
  };
}

/** Los correos se comparan sin importar mayúsculas ni espacios al inicio o al final. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
