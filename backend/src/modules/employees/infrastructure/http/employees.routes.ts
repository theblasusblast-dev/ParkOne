import { Router } from 'express';
import { errorResponses } from '../../../../infrastructure/openapi/common-schemas';
import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { TAGS } from '../../../../infrastructure/openapi/tags';
import { z } from '../../../../shared/zod';
import type { AuthGuards } from '../../../auth/infrastructure/http/auth.guards';
import type { CreateEmployeeUseCase } from '../../application/create-employee.use-case';
import type { ListEmployeesUseCase } from '../../application/list-employees.use-case';
import type { UpdateEmployeeUseCase } from '../../application/update-employee.use-case';
import type { Employee } from '../../domain/employee';
import {
  CreateEmployeeRequestSchema,
  EmployeeIdParamsSchema,
  EmployeeSchema,
  ListEmployeesQuerySchema,
  UpdateEmployeeRequestSchema,
} from './employees.schemas';

const json = (schema: z.ZodType) => ({ 'application/json': { schema } });

const ADMIN_ONLY = {
  401: 'Sin sesión (AUTH_REQUIRED) o sesión inválida.',
  403: 'El usuario no es administrador (FORBIDDEN).',
};

openApiRegistry.registerPath({
  method: 'post',
  path: '/api/employees',
  tags: [TAGS.employees.name],
  summary: 'Crear empleado',
  description: 'Crea un empleado asignado a una sede, con una contraseña inicial. Solo administrador.',
  security: [{ bearerAuth: [] }],
  request: { body: { content: json(CreateEmployeeRequestSchema) } },
  responses: {
    201: { description: 'Empleado creado; ya puede iniciar sesión.', content: json(EmployeeSchema) },
    ...errorResponses({
      400: 'Datos inválidos, por ejemplo una contraseña de menos de 8 caracteres (VALIDATION_ERROR).',
      ...ADMIN_ONLY,
      404: 'La sede no existe (SITE_NOT_FOUND).',
      409: 'Ya existe un usuario con ese correo (EMAIL_TAKEN).',
    }),
  },
});

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/employees',
  tags: [TAGS.employees.name],
  summary: 'Listar empleados',
  description: 'Lista los empleados con su sede y estado, ordenados por nombre. Solo administrador.',
  security: [{ bearerAuth: [] }],
  request: { query: ListEmployeesQuerySchema },
  responses: {
    200: { description: 'Empleados encontrados.', content: json(z.array(EmployeeSchema)) },
    ...errorResponses({ 400: 'Filtro inválido (VALIDATION_ERROR).', ...ADMIN_ONLY }),
  },
});

openApiRegistry.registerPath({
  method: 'patch',
  path: '/api/employees/{id}',
  tags: [TAGS.employees.name],
  summary: 'Actualizar empleado',
  description:
    'Cambia el nombre, la sede o el estado de un empleado. Con `"active": false` ' +
    'el empleado no puede iniciar sesión y su sesión actual deja de funcionar. Solo administrador.',
  security: [{ bearerAuth: [] }],
  request: {
    params: EmployeeIdParamsSchema,
    body: { content: json(UpdateEmployeeRequestSchema) },
  },
  responses: {
    200: { description: 'Empleado actualizado.', content: json(EmployeeSchema) },
    ...errorResponses({
      400: 'Datos inválidos o cuerpo vacío (VALIDATION_ERROR).',
      ...ADMIN_ONLY,
      404: 'No existe el empleado (EMPLOYEE_NOT_FOUND) o la sede (SITE_NOT_FOUND).',
    }),
  },
});

/** Convierte el empleado del dominio en la respuesta documentada (fecha en texto ISO). */
function toResponse(employee: Employee): z.infer<typeof EmployeeSchema> {
  return { ...employee, createdAt: employee.createdAt.toISOString() };
}

export interface EmployeesUseCases {
  create: CreateEmployeeUseCase;
  list: ListEmployeesUseCase;
  update: UpdateEmployeeUseCase;
}

export function createEmployeesRouter(useCases: EmployeesUseCases, guards: AuthGuards): Router {
  const router = Router();

  // Todas las rutas de empleados son exclusivas del administrador.
  router.use(guards.authenticate, guards.allow('ADMIN'));

  router.post('/', async (req, res) => {
    const input = CreateEmployeeRequestSchema.parse(req.body);
    res.status(201).json(toResponse(await useCases.create.execute(input)));
  });

  router.get('/', async (req, res) => {
    const query = ListEmployeesQuerySchema.parse(req.query);
    const employees = await useCases.list.execute({
      ...(query.siteId === undefined ? {} : { siteId: query.siteId }),
      ...(query.active === undefined ? {} : { active: query.active === 'true' }),
    });
    res.json(employees.map(toResponse));
  });

  router.patch('/:id', async (req, res) => {
    const { id } = EmployeeIdParamsSchema.parse(req.params);
    const changes = UpdateEmployeeRequestSchema.parse(req.body);
    res.json(toResponse(await useCases.update.execute(id, changes)));
  });

  return router;
}
