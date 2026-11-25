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
];
