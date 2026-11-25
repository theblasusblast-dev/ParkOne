import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models';
import { AuthService } from './auth.service';

/** Solo deja pasar con sesión iniciada. */
export const authGuard: CanActivateFn = () => {
  return inject(AuthService).user() ? true : inject(Router).createUrlTree(['/login']);
};

/** Solo deja pasar al rol indicado; a los demás los manda a su inicio. */
export const roleGuard =
  (role: Role): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.user();
    if (!user) return router.createUrlTree(['/login']);
    return user.role === role ? true : router.createUrlTree([auth.homeFor(user)]);
  };

/** El login solo se muestra a quien no ha iniciado sesión. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const user = auth.user();
  return user ? inject(Router).createUrlTree([auth.homeFor(user)]) : true;
};
