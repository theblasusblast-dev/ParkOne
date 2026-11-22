import type { Band } from '../../../shared/domain/band';
import { toMinutes } from '../../../shared/domain/clock-time';

/**
 * Calendario del parqueadero: día operativo y franja de un instante.
 * Única fuente de estas reglas (DRY): la usan el ingreso, la salida y las consultas.
 *
 * Colombia usa UTC-5 todo el año (sin horario de verano), así que basta un
 * desplazamiento fijo para pasar de la hora guardada (UTC) a la hora local (S-07).
 */
const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000;

interface LocalTime {
  /** Fecha local en formato AAAA-MM-DD. */
  date: string;
  /** Minutos desde la medianoche local. */
  minutes: number;
}

function toLocal(instant: Date): LocalTime {
  const local = new Date(instant.getTime() + BOGOTA_OFFSET_MS);
  return {
    date: local.toISOString().slice(0, 10),
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
  };
}

function previousDate(date: string): string {
  const day = new Date(`${date}T00:00:00.000Z`);
  day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
}

/**
 * Día operativo (S-02): empieza con la franja diurna. Con inicio a las 06:00,
 * las 05:59 del 23 pertenecen al día operativo del 22.
 */
export function operatingDayOf(instant: Date, dayBandStart: string): string {
  const local = toLocal(instant);
  return local.minutes < toMinutes(dayBandStart) ? previousDate(local.date) : local.date;
}

/** Franja de un instante (S-01): diurna entre sus dos inicios; el resto es nocturna. */
export function bandOf(instant: Date, dayBandStart: string, nightBandStart: string): Band {
  const { minutes } = toLocal(instant);
  return minutes >= toMinutes(dayBandStart) && minutes < toMinutes(nightBandStart) ? 'DAY' : 'NIGHT';
}

/**
 * Fin del día operativo: el inicio de la franja diurna del día siguiente.
 * Hasta ese instante vale el pase de un cobro pagado (RN-03).
 */
export function operatingDayEnd(operatingDay: string, dayBandStart: string): Date {
  const next = new Date(`${operatingDay}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const localStart = Date.parse(`${next.toISOString().slice(0, 10)}T${dayBandStart}:00.000Z`);
  return new Date(localStart - BOGOTA_OFFSET_MS);
}
