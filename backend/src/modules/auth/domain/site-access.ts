import { AppError } from '../../../shared/app-error';
import type { PublicProfile } from './user-account';

/**
 * Regla de alcance por sede: el administrador ve todas; un empleado solo la
 * suya. La usan todos los módulos que exponen datos de una sede.
 */
export function assertSiteAccess(user: PublicProfile, siteId: string): void {
  if (user.role === 'ADMIN') return;
  if (user.site?.id !== siteId) {
    throw new AppError(403, 'SITE_FORBIDDEN', 'Solo puedes acceder a la sede donde trabajas.');
  }
}
