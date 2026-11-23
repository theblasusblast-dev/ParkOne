/**
 * Eventos del dominio (patrón Observer / publicar-suscribir). Un módulo publica
 * lo que pasó sin saber quién escucha; por ejemplo, Pagos avisa que un cobro
 * se pagó y la pantalla del carril se actualiza sin que Pagos la conozca.
 */
export type DomainEvent =
  | {
      type: 'PAYMENT_CONFIRMED';
      siteId: string;
      plate: string;
      chargeId: string;
      amountCop: number;
    }
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
  | {
      type: 'SPOTS_CHANGED';
      siteId: string;
    };

export interface EventPublisher {
  publish(event: DomainEvent): void;
}
