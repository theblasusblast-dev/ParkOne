import type { DomainEvent, EventPublisher } from '../../shared/domain/events';

type Listener = (event: DomainEvent) => void;

/**
 * Bus de eventos en memoria: suficiente para un monolito. En producción se
 * reemplaza por RabbitMQ o MQTT detrás del mismo puerto EventPublisher.
 */
export class InMemoryEventBus implements EventPublisher {
  private readonly listeners = new Set<Listener>();

  subscribe(listener: Listener): void {
    this.listeners.add(listener);
  }

  publish(event: DomainEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        // Un suscriptor que falla no debe tumbar la operación que publicó el evento.
        console.error('Error en un suscriptor de eventos:', error);
      }
    }
  }
}
