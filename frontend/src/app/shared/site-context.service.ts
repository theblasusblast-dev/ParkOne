import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { API_URL } from '../core/api.config';
import { AuthService } from '../core/auth/auth.service';
import { SiteOption } from '../core/models';

const STORAGE_KEY = 'parkone.site';

/**
 * Sede con la que trabaja la pantalla. El empleado siempre usa la suya; el
 * administrador elige una de la lista (y se recuerda al recargar).
 */
@Injectable({ providedIn: 'root' })
export class SiteContext {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly chosen = signal<string | null>(localStorage.getItem(STORAGE_KEY));

  readonly sites = signal<SiteOption[]>([]);

  readonly siteId = computed(() => {
    const own = this.auth.user()?.site?.id;
    if (own) return own;
    const list = this.sites();
    const chosen = this.chosen();
    return list.find((site) => site.id === chosen)?.id ?? list[0]?.id ?? null;
  });

  readonly siteName = computed(
    () => this.auth.user()?.site?.name ?? this.sites().find((site) => site.id === this.siteId())?.name ?? '',
  );

  /** Carga la lista de sedes si el usuario es administrador. */
  load(): void {
    if (this.auth.isAdmin()) {
      this.http.get<SiteOption[]>(`${API_URL}/sites`).subscribe((sites) => this.sites.set(sites));
    }
  }

  choose(siteId: string): void {
    localStorage.setItem(STORAGE_KEY, siteId);
    this.chosen.set(siteId);
  }
}
