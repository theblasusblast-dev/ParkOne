import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { NAVIGATION } from './navigation';

/** Estructura de las páginas con sesión: menú lateral y contenido. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly links = computed(() => {
    const role = this.auth.user()?.role;
    return NAVIGATION.filter((item) => role && item.roles.includes(role));
  });
  protected readonly roleLabel = computed(() => (this.auth.isAdmin() ? 'Administrador' : 'Empleado'));
}
