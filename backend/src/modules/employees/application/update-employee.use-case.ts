import { AppError } from '../../../shared/app-error';
import type { Employee } from '../domain/employee';
import type { EmployeeChanges, EmployeeRepository } from './ports';

/**
 * Cambia el nombre, la sede o el estado de un empleado. Desactivarlo le
 * cierra el acceso de inmediato: el login lo rechaza y cada petición
 * protegida vuelve a verificar que siga activo.
 */
export class UpdateEmployeeUseCase {
  constructor(private readonly employees: EmployeeRepository) {}

  async execute(employeeId: string, changes: EmployeeChanges): Promise<Employee> {
    if (!(await this.employees.findById(employeeId))) {
      throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'No existe un empleado con ese id.');
    }
    if (changes.siteId !== undefined && !(await this.employees.siteExists(changes.siteId))) {
      throw new AppError(404, 'SITE_NOT_FOUND', 'No existe una sede con ese id.');
    }
    return this.employees.update(employeeId, changes);
  }
}
