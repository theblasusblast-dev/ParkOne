import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../../core/api.config';
import { AccessResult, PlateDecision, VehicleType } from '../../core/models';

/** Llamadas a la API que usa la pantalla del carril. */
@Injectable({ providedIn: 'root' })
export class LaneApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/access`;

  readPlate(body: { text: string; region: string; confidence: number; attempt: number }) {
    return this.http.post<PlateDecision>(`${this.base}/plate-readings`, body);
  }

  enter(body: { siteId: string; plate: string; vehicleType: VehicleType; confidence: number; region: string }) {
    return this.http.post<AccessResult>(`${this.base}/entries`, body);
  }

  enterManual(body: { siteId: string; plate: string; vehicleType: VehicleType; foreignPlate: boolean }) {
    return this.http.post<AccessResult>(`${this.base}/manual-entries`, body);
  }

  exit(body: { siteId: string; plate: string }) {
    return this.http.post<AccessResult>(`${this.base}/exits`, body);
  }
}
