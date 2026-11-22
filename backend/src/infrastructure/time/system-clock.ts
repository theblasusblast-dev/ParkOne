import type { Clock } from '../../shared/domain/clock';

/** Reloj real, el que usa la API en ejecución. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
