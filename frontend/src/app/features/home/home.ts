import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { API_URL } from '../../core/api.config';
import { AuthService } from '../../core/auth/auth.service';
import { Health } from '../../core/models';

/** Página de inicio: saludo, sede y estado del sistema. */
@Component({
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  protected readonly auth = inject(AuthService);
  protected readonly health = signal<Health | null>(null);
  protected readonly apiDown = signal(false);

  constructor() {
    inject(HttpClient)
      .get<Health>(`${API_URL}/health`)
      .subscribe({
        next: (health) => this.health.set(health),
        error: () => this.apiDown.set(true),
      });
  }
}
