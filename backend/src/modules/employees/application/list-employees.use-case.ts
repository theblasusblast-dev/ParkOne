import type { Employee } from '../domain/employee';
import type { EmployeeFilter, EmployeeRepository } from './ports';

/** Lista empleados, opcionalmente filtrados por sede y por estado. */
export class ListEmployeesUseCase {
  constructor(private readonly employees: EmployeeRepository) {}

  execute(filter: EmployeeFilter): Promise<Employee[]> {
    return this.employees.list(filter);
  }
}
