import { Role } from '../core/models';

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles: Role[];
}

/** Menú lateral. Cada pantalla nueva agrega aquí su enlace. */
export const NAVIGATION: NavItem[] = [
  { label: 'Inicio', icon: '◎', path: '/inicio', roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'Mapa', icon: '▦', path: '/mapa', roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'Carril', icon: '⇄', path: '/carril', roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'Caja', icon: '$', path: '/caja', roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'Historial', icon: '☰', path: '/historial', roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'Sedes', icon: '⌂', path: '/admin/sedes', roles: ['ADMIN'] },
  { label: 'Empleados', icon: '☺', path: '/admin/empleados', roles: ['ADMIN'] },
  { label: 'Tarifas', icon: '⏱', path: '/admin/tarifas', roles: ['ADMIN'] },
];
