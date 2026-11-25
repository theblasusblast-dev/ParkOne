/*
 * Tipos de las respuestas de la API. Son los mismos esquemas que documenta
 * Swagger, escritos del lado del frontend.
 */
export type Role = 'ADMIN' | 'EMPLOYEE';
export type VehicleType = 'CAR' | 'MOTORCYCLE';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  site: { id: string; name: string } | null;
}

export interface LoginResponse {
  token: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  user: UserProfile;
}

export interface Health {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  database: 'up' | 'down';
}

/** Eventos de tiempo real que envía el backend por Socket.IO. */
export type RealtimeEvent =
  | { type: 'PAYMENT_CONFIRMED'; siteId: string; plate: string; chargeId: string; amountCop: number }
  | {
      type: 'ACCESS_DECIDED';
      siteId: string;
      direction: 'ENTRY' | 'EXIT';
      plate: string;
      outcome: string;
      barrierOpened: boolean;
      message: string;
      spotCode: string | null;
    }
  | { type: 'SPOTS_CHANGED'; siteId: string };

export type Band = 'DAY' | 'NIGHT';
export type ChargeStatus = 'PENDING' | 'PAID' | 'VOIDED' | 'EXPIRED';
export type SpotStatus = 'FREE' | 'OCCUPIED' | 'DISABLED';

export interface SiteOption {
  id: string;
  name: string;
  city: string;
}

export interface Charge {
  id: string;
  plate: string;
  operatingDay: string;
  band: Band;
  amountCop: number;
  status: ChargeStatus;
}

export interface PlateDecision {
  outcome: 'ACCEPTED' | 'RETRY' | 'MANUAL_REVIEW';
  plate: string | null;
  vehicleType: VehicleType | null;
  attempt: number;
  maxAttempts: number;
  message: string;
}

export interface AccessResult {
  outcome: string;
  barrierOpened: boolean;
  message: string;
  plate: string;
  spot: { id: string; code: string } | null;
}

export interface Spot {
  id: string;
  code: string;
  vehicleType: VehicleType;
  status: SpotStatus;
  disabledReason: string | null;
  occupant: {
    plate: string;
    since: string;
    minutesParked: number;
    charge: { amountCop: number; band: Band; status: ChargeStatus } | null;
  } | null;
}
