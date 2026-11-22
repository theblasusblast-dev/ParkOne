/**
 * Roles del sistema. ADMIN gestiona sedes, empleados y tarifas; EMPLOYEE
 * opera una sede. Los valores coinciden con el enum Role de la base de datos.
 */
export const ROLES = ['ADMIN', 'EMPLOYEE'] as const;

export type Role = (typeof ROLES)[number];
