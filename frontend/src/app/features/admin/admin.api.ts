import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../../core/api.config';
import { Employee, Rate, SiteRates, SiteSummary, VehicleType } from '../../core/models';

export interface NewSite {
  name: string;
  department: string;
  city: string;
  carSpots: number;
  motorcycleSpots: number;
}

export interface NewEmployee {
  fullName: string;
  email: string;
  password: string;
  siteId: string;
}

/** Llamadas a la API del panel de administración. */
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);

  sites() {
    return this.http.get<SiteSummary[]>(`${API_URL}/sites`);
  }

  createSite(site: NewSite) {
    return this.http.post<SiteSummary>(`${API_URL}/sites`, site);
  }

  employees() {
    return this.http.get<Employee[]>(`${API_URL}/employees`);
  }

  createEmployee(employee: NewEmployee) {
    return this.http.post<Employee>(`${API_URL}/employees`, employee);
  }

  updateEmployee(id: string, changes: { siteId?: string; active?: boolean }) {
    return this.http.patch<Employee>(`${API_URL}/employees/${id}`, changes);
  }

  rates(siteId: string) {
    return this.http.get<SiteRates>(`${API_URL}/sites/${siteId}/rates`);
  }

  updateRates(siteId: string, rates: { vehicleType: VehicleType; dayAmountCop: number; nightAmountCop: number }[]) {
    return this.http.put<SiteRates>(`${API_URL}/sites/${siteId}/rates`, { rates });
  }

  rateHistory(siteId: string) {
    return this.http.get<Rate[]>(`${API_URL}/sites/${siteId}/rates/history`);
  }

  updateBands(siteId: string, bands: { dayBandStart: string; nightBandStart: string }) {
    return this.http.patch(`${API_URL}/sites/${siteId}/bands`, bands);
  }
}
