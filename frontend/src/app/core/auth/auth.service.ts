import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { API_URL } from '../api.config';
import { LoginResponse, UserProfile } from '../models';

interface Session {
  token: string;
  user: UserProfile;
  expiresAt: number;
}

const STORAGE_KEY = 'parkone.session';

/** Lee la sesión guardada en el navegador, si existe y no ha expirado. */
function readStoredSession(): Session | null {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Session | null;
    return session && session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

/**
 * Sesión del usuario. Guarda el token en el navegador para no pedir login en
 * cada recarga, y expone el usuario como signal para que la interfaz reaccione.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = signal<Session | null>(readStoredSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  login(email: string, password: string): Observable<UserProfile> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, { email, password }).pipe(
      map((response) => {
        const session: Session = {
          token: response.token,
          user: response.user,
          expiresAt: Date.now() + response.expiresInSeconds * 1000,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        this.session.set(session);
        return response.user;
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
    void this.router.navigate(['/login']);
  }

  /**
   * Página a la que entra cada rol después del login: el empleado, al mapa de
   * su sede; el administrador, a su panel de sedes.
   */
  homeFor(user: UserProfile): string {
    return user.role === 'EMPLOYEE' ? '/mapa' : '/admin/sedes';
  }
}
