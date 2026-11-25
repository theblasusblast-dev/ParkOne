import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../../core/api.config';
import { Spot } from '../../core/models';

/** Llamadas a la API que usa el mapa de espacios. */
@Injectable({ providedIn: 'root' })
export class MapApi {
  private readonly http = inject(HttpClient);

  spots(siteId: string) {
    return this.http.get<Spot[]>(`${API_URL}/sites/${siteId}/spots`);
  }

  changeStatus(spotId: string, status: 'FREE' | 'DISABLED', reason: string | null) {
    return this.http.patch<void>(`${API_URL}/spots/${spotId}`, { status, reason });
  }
}
