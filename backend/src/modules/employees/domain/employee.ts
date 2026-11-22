/** Empleado de una sede (usuario con rol EMPLOYEE). Nunca incluye el hash de la contraseña. */
export interface Employee {
  id: string;
  fullName: string;
  email: string;
  active: boolean;
  site: { id: string; name: string };
  createdAt: Date;
}
