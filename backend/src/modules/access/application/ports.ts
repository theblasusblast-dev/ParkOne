import type { Band } from '../../../shared/domain/band';
import type { VehicleType } from '../../../shared/domain/vehicle-type';
import type { Charge } from '../../billing/domain/charge';

export interface SiteSchedule {
  dayBandStart: string;
  nightBandStart: string;
}

export interface SpotRef {
  id: string;
  code: string;
}

export interface NewCharge {
  operatingDay: string;
  band: Band;
  rateId: string;
  amountCop: number;
}

export interface AccessEventData {
  siteId: string;
  plate: string;
  vehicleType: VehicleType;
  direction: 'ENTRY' | 'EXIT';
  occurredAt: Date;
  confidence: number | null;
  plateRegion: string | null;
  manualRead: boolean;
  foreignPlate: boolean;
  barrierOpened: boolean;
  decisionReason: string;
  spotId: string | null;
  operatorId: string | null;
}

export interface AccessRepository {
  findSchedule(siteId: string): Promise<SiteSchedule | null>;
  /** Espacio que ocupa la placa en la sede, si ya está adentro. */
  findSpotOf(siteId: string, plate: string): Promise<SpotRef | null>;
  /** Primer espacio libre del tipo, en orden de código (C-01, C-02…). */
  findFreeSpot(siteId: string, vehicleType: VehicleType): Promise<SpotRef | null>;
  findCharge(siteId: string, plate: string, operatingDay: string): Promise<Charge | null>;
  findCurrentRate(siteId: string, vehicleType: VehicleType, band: Band): Promise<{ id: string; amountCop: number } | null>;
  /** Ocupa el espacio, crea el cobro (si hay) y registra el evento, en una transacción. */
  admit(spotId: string, event: AccessEventData, newCharge: NewCharge | null): Promise<{ eventId: string; charge: Charge | null }>;
  /** Registra un evento sin otros cambios (por ejemplo, un ingreso rechazado). */
  recordEvent(event: AccessEventData): Promise<string>;
}
