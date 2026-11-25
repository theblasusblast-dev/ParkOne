import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../../core/api.config';
import { ChargeRow, EventRow, Page, PaymentRow } from '../../core/models';

export type HistoryParams = Record<string, string | number>;

/** Llamadas a la API que usa el historial. */
@Injectable({ providedIn: 'root' })
export class HistoryApi {
  private readonly http = inject(HttpClient);

  events(params: HistoryParams) {
    return this.http.get<Page<EventRow>>(`${API_URL}/history/events`, { params });
  }

  charges(params: HistoryParams) {
    return this.http.get<Page<ChargeRow>>(`${API_URL}/history/charges`, { params });
  }

  payments(params: HistoryParams) {
    return this.http.get<Page<PaymentRow>>(`${API_URL}/history/payments`, { params });
  }
}
