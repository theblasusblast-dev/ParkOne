import { AppError } from '../../../shared/app-error';
import { normalizeEmail } from '../../auth/domain/user-account';
import type { Employee } from '../domain/employee';
import type { EmployeeRepository, PasswordHasher } from './ports';

export interface CreateEmployeeInput {
  fullName: string;
  email: string;
  password: string;
  siteId: string;
}

/** Crea un empleado asignado a una sede, con su contraseña inicial. */
export class CreateEmployeeUseCase {
  constructor(
    private readonly employees: EmployeeRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  async execute(input: CreateEmployeeInput): Promise<Employee> {
    const email = normalizeEmail(input.email);

    if (await this.employees.emailExists(email)) {
      throw new AppError(409, 'EMAIL_TAKEN', `Ya existe un usuario con el correo ${email}.`);
    }
    if (!(await this.employees.siteExists(input.siteId))) {
      throw new AppError(404, 'SITE_NOT_FOUND', 'No existe una sede con ese id.');
    }

    return this.employees.create({
      fullName: input.fullName,
      email,
      passwordHash: await this.passwords.hash(input.password),
      siteId: input.siteId,
    });
  }
}
