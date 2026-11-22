/** Hora del día en formato HH:MM de 24 horas, por ejemplo "06:00" o "18:30". */
export const CLOCK_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Convierte "HH:MM" en minutos desde la medianoche: "06:00" → 360. */
export function toMinutes(clockTime: string): number {
  if (!CLOCK_TIME_PATTERN.test(clockTime)) {
    throw new Error(`Hora inválida: "${clockTime}". Se espera el formato HH:MM.`);
  }
  const [hours, minutes] = clockTime.split(':').map(Number);
  return hours! * 60 + minutes!;
}
