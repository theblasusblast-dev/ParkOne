/**
 * Error controlado de la aplicación.
 *
 * Cualquier capa puede lanzarlo con el código HTTP y un código legible por
 * máquina (por ejemplo 'PLATE_NOT_RECOGNIZED'). El manejador de errores lo
 * convierte siempre en la misma forma de respuesta JSON.
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
