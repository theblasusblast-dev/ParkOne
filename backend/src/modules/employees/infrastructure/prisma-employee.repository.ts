import type { PrismaClient } from '@prisma/client';
import type { EmployeeChanges, EmployeeFilter, EmployeeRepository, NewEmployeeData } from '../application/ports';
import type { Employee } from '../domain/employee';

/** Campos que se leen de un empleado: nunca el hash de la contraseña. */
const EMPLOYEE_FIELDS = {
  id: true,
  fullName: true,
  email: true,
  active: true,
  createdAt: true,
  site: { select: { id: true, name: true } },
} as const;

type EmployeeRow = {
  id: string;
  fullName: string;
  email: string;
  active: boolean;
  createdAt: Date;
  site: { id: string; name: string } | null;
};

/** Adaptador de persistencia de empleados: usuarios con rol EMPLOYEE. */
export class PrismaEmployeeRepository implements EmployeeRepository {
  constructor(private readonly db: PrismaClient) {}

  async emailExists(email: string): Promise<boolean> {
    return (await this.db.user.findUnique({ where: { email }, select: { id: true } })) !== null;
  }

  async siteExists(siteId: string): Promise<boolean> {
    return (await this.db.site.findUnique({ where: { id: siteId }, select: { id: true } })) !== null;
  }

  async create(data: NewEmployeeData): Promise<Employee> {
    const row = await this.db.user.create({
      data: { ...data, role: 'EMPLOYEE' },
      select: EMPLOYEE_FIELDS,
    });
    return toEmployee(row);
  }

  async list(filter: EmployeeFilter): Promise<Employee[]> {
    const rows = await this.db.user.findMany({
      where: {
        role: 'EMPLOYEE',
        ...(filter.siteId === undefined ? {} : { siteId: filter.siteId }),
        ...(filter.active === undefined ? {} : { active: filter.active }),
      },
      orderBy: { fullName: 'asc' },
      select: EMPLOYEE_FIELDS,
    });
    return rows.map(toEmployee);
  }

  async findById(id: string): Promise<Employee | null> {
    const row = await this.db.user.findFirst({ where: { id, role: 'EMPLOYEE' }, select: EMPLOYEE_FIELDS });
    return row ? toEmployee(row) : null;
  }

  async update(id: string, changes: EmployeeChanges): Promise<Employee> {
    const row = await this.db.user.update({ where: { id }, data: changes, select: EMPLOYEE_FIELDS });
    return toEmployee(row);
  }
}

function toEmployee(row: EmployeeRow): Employee {
  // Un empleado siempre se crea con sede; si faltara, el dato está corrupto.
  if (!row.site) throw new Error(`El empleado ${row.id} no tiene sede asignada.`);
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    active: row.active,
    site: row.site,
    createdAt: row.createdAt,
  };
}
