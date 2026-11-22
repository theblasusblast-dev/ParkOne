/**
 * Reloj del sistema como dependencia. Las reglas de cobro dependen de la hora;
 * si los casos de uso leyeran new Date() directamente, las pruebas no podrían
 * simular las 05:50 o las 19:00. Con este puerto, una prueba inyecta un reloj fijo.
 */
export interface Clock {
  now(): Date;
}
