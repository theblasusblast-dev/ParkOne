import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { z } from '../../../../shared/zod';

const fullName = z
  .string()
  .trim()
  .min(3, 'El nombre debe tener al menos 3 caracteres.')
  .max(80, 'El nombre puede tener máximo 80 caracteres.');

const siteId = z.uuid('El id de la sede no es válido.');

export const CreateEmployeeRequestSchema = openApiRegistry.register(
  'CreateEmployeeRequest',
  z.object({
    fullName: fullName.openapi({ example: 'Laura Gómez' }),
    email: z.email('Escribe un correo válido.').openapi({ example: 'laura.gomez@parkone.co' }),
    // bcrypt solo usa los primeros 72 bytes, por eso el máximo.
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .max(72, 'La contraseña puede tener máximo 72 caracteres.')
      .openapi({ example: 'Laura2026*' }),
    siteId: siteId.openapi({ description: 'Sede donde trabajará el empleado.' }),
  }),
);

export const UpdateEmployeeRequestSchema = openApiRegistry.register(
  'UpdateEmployeeRequest',
  z
    .object({
      fullName: fullName.optional(),
      siteId: siteId.optional().openapi({ description: 'Nueva sede del empleado.' }),
      active: z.boolean().optional().openapi({ description: 'false desactiva al empleado y le cierra el acceso.' }),
    })
    .refine((changes) => Object.values(changes).some((value) => value !== undefined), {
      message: 'Envía al menos un campo para actualizar.',
    })
    .openapi({ example: { active: false } }),
);

export const EmployeeSchema = openApiRegistry.register(
  'Employee',
  z.object({
    id: z.uuid().openapi({ example: '9b2d5f3a-1c4e-4f8a-b6d7-2e3f4a5b6c7d' }),
    fullName: z.string().openapi({ example: 'Laura Gómez' }),
    email: z.email().openapi({ example: 'laura.gomez@parkone.co' }),
    active: z.boolean().openapi({ example: true }),
    site: z.object({
      id: z.uuid(),
      name: z.string().openapi({ example: 'ParkOne Centro' }),
    }),
    createdAt: z.string().openapi({ format: 'date-time', example: '2026-11-22T17:30:00.000Z' }),
  }),
);

export const ListEmployeesQuerySchema = z.object({
  siteId: siteId.optional().openapi({ description: 'Solo empleados de esta sede.' }),
  active: z.enum(['true', 'false']).optional().openapi({ description: 'Solo activos (true) o solo inactivos (false).' }),
});

export const EmployeeIdParamsSchema = z.object({
  id: z.uuid('El id del empleado no es válido.'),
});
