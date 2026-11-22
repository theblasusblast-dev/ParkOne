import { prisma } from '../../infrastructure/persistence/prisma';
import type { AuthGuards } from '../auth/infrastructure/http/auth.guards';
import { CreateEmployeeUseCase } from './application/create-employee.use-case';
import { ListEmployeesUseCase } from './application/list-employees.use-case';
import { UpdateEmployeeUseCase } from './application/update-employee.use-case';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { createEmployeesRouter } from './infrastructure/http/employees.routes';
import { PrismaEmployeeRepository } from './infrastructure/prisma-employee.repository';

/** Ensambla el módulo de empleados. */
export function createEmployeesModule(guards: AuthGuards) {
  const employees = new PrismaEmployeeRepository(prisma);

  return {
    router: createEmployeesRouter(
      {
        create: new CreateEmployeeUseCase(employees, new BcryptPasswordHasher()),
        list: new ListEmployeesUseCase(employees),
        update: new UpdateEmployeeUseCase(employees),
      },
      guards,
    ),
  };
}
