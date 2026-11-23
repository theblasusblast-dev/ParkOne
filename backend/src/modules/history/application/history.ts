import { AppError } from '../../../shared/app-error';
import type { Band } from '../../../shared/domain/band';
import type { VehicleType } from '../../../shared/domain/vehicle-type';
import { assertSiteAccess } from '../../auth/domain/site-access';
import type { PublicProfile } from '../../auth/domain/user-account';
import type { ChargeStatus } from '../../billing/domain/charge';

export interface PageRequest {
  page: number;
  pageSize: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Filtros comunes: placa (o parte) y rango de días locales AAAA-MM-DD, ambos incluidos. */
export interface HistoryFilter extends PageRequest {
  siteId: string;
  plate?: string;
  from?: string;
  to?: string;
}

export interface ChargeFilter extends HistoryFilter {
  status?: ChargeStatus;
  band?: Band;
}

export interface EventRow {
  id: string;
  occurredAt: Date;
  direction: 'ENTRY' | 'EXIT';
  plate: string;
  vehicleType: VehicleType;
  barrierOpened: boolean;
  decisionReason: string;
  manualRead: boolean;
  foreignPlate: boolean;
  confidence: number | null;
  spotCode: string | null;
  operatorName: string | null;
}

export interface ChargeRow {
  id: string;
  plate: string;
  vehicleType: VehicleType;
  operatingDay: string;
  band: Band;
  amountCop: number;
  status: ChargeStatus;
  createdAt: Date;
  paidAt: Date | null;
}

export interface PaymentRow {
  id: string;
  paidAt: Date;
  amountCop: number;
  reference: string;
  plate: string;
  band: Band;
  receivedByName: string;
}

export interface HistoryRepository {
  siteExists(siteId: string): Promise<boolean>;
  events(filter: HistoryFilter): Promise<Page<EventRow>>;
  charges(filter: ChargeFilter): Promise<Page<ChargeRow>>;
  payments(filter: HistoryFilter): Promise<Page<PaymentRow>>;
}

/**
 * Consultas del historial de una sede (F-09): ingresos y salidas, cobros y
 * pagos. El empleado solo consulta su sede; el administrador, cualquiera.
 */
export class HistoryQueries {
  constructor(private readonly history: HistoryRepository) {}

  async events(user: PublicProfile, filter: HistoryFilter): Promise<Page<EventRow>> {
    await this.check(user, filter);
    return this.history.events(filter);
  }

  async charges(user: PublicProfile, filter: ChargeFilter): Promise<Page<ChargeRow>> {
    await this.check(user, filter);
    return this.history.charges(filter);
  }

  async payments(user: PublicProfile, filter: HistoryFilter): Promise<Page<PaymentRow>> {
    await this.check(user, filter);
    return this.history.payments(filter);
  }

  private async check(user: PublicProfile, filter: HistoryFilter): Promise<void> {
    assertSiteAccess(user, filter.siteId);
    if (filter.from && filter.to && filter.from > filter.to) {
      throw new AppError(400, 'INVALID_RANGE', 'La fecha inicial no puede ser posterior a la final.');
    }
    if (!(await this.history.siteExists(filter.siteId))) {
      throw new AppError(404, 'SITE_NOT_FOUND', 'No existe una sede con ese id.');
    }
  }
}
