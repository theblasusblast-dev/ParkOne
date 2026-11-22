import type { Employee } from '../domain/employee';

export interface NewEmployeeData {
  fullName: string;
  email: string;
  passwordHash: string;
  siteId: string;
}

export interface EmployeeChanges {
  fullName?: string;
  siteId?: string;
  active?: boolean;
}

export interface EmployeeFilter {
  siteId?: string;
  active?: boolean;
}

export interface EmployeeRepository {
  emailExists(email: string): Promise<boolean>;
  siteExists(siteId: string): Promise<boolean>;
  create(data: NewEmployeeData): Promise<Employee>;
  list(filter: EmployeeFilter): Promise<Employee[]>;
  findById(id: string): Promise<Employee | null>;
  update(id: string, changes: EmployeeChanges): Promise<Employee>;
}

/**
 * Convierte una contraseña en su hash. Es un puerto distinto del verificador
 * que usa el login: cada módulo depende solo de la operación que necesita
 * (segregación de interfaces, la I de SOLID).
 */
export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;
}
