import { HttpErrorResponse } from '@angular/common/http';

/**
 * Mensaje para mostrar al usuario a partir de un error de la API. El backend
 * siempre responde { error: { code, message } }, así que se usa su mensaje.
 */
export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No se pudo conectar con la API. Verifica que el backend esté encendido.';
    const message = error.error?.error?.message;
    if (typeof message === 'string') return message;
  }
  return 'Ocurrió un error inesperado.';
}
