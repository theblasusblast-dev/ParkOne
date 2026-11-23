import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { InMemoryEventBus } from '../events/in-memory-event-bus';

/**
 * Tiempo real con Socket.IO: cada pantalla se une a la "sala" de su sede y
 * recibe los eventos de esa sede (barrera, espacios, pagos). Es un suscriptor
 * más del bus de eventos: los módulos no saben que existe.
 *
 * Mensajes al cliente: ACCESS_DECIDED, SPOTS_CHANGED, PAYMENT_CONFIRMED.
 */
export function attachRealtime(httpServer: HttpServer, events: InMemoryEventBus, corsOrigin: string): Server {
  const io = new Server(httpServer, { cors: { origin: corsOrigin } });

  io.on('connection', (socket) => {
    socket.on('join-site', (siteId: unknown) => {
      if (typeof siteId === 'string') void socket.join(`site:${siteId}`);
    });
  });

  events.subscribe((event) => {
    io.to(`site:${event.siteId}`).emit(event.type, event);
  });

  return io;
}
