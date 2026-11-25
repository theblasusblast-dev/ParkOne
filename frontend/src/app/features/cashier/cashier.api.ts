import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../../core/api.config';
import { Charge, PayResult } from '../../core/models';

/** Llamadas a la API que usa la caja. */
@Injectable({ providedIn: 'root' })
export class CashierApi {
  private readonly http = inject(HttpClient);

  pending(siteId: string, plate: string) {
    return this.http.get<Charge[]>(`${API_URL}/charges/pending`, { params: { siteId, plate } });
  }

  pay(chargeId: string, amountCop: number, reference: string) {
    return this.http.post<PayResult>(`${API_URL}/charges/${chargeId}/payments`, { amountCop, reference });
  }
}
