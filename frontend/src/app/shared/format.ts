import { Band, ChargeStatus, SpotStatus, VehicleType } from '../core/models';

/*
 * Textos y formatos para la interfaz, en un solo lugar (DRY): todas las
 * pantallas muestran "Carro", "$8.000" o "1 h 35 min" de la misma forma.
 */
const COP = new Intl.NumberFormat('es-CO');

export const formatCop = (amount: number) => `$${COP.format(amount)}`;

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours} h ${rest} min` : `${rest} min`;
}

export const VEHICLE_LABEL: Record<VehicleType, string> = { CAR: 'Carro', MOTORCYCLE: 'Moto' };
export const BAND_LABEL: Record<Band, string> = { DAY: 'Diurna', NIGHT: 'Nocturna' };
export const CHARGE_LABEL: Record<ChargeStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  VOIDED: 'Anulado',
  EXPIRED: 'Vencido',
};
export const SPOT_LABEL: Record<SpotStatus, string> = { FREE: 'Libre', OCCUPIED: 'Ocupado', DISABLED: 'Inhabilitado' };
