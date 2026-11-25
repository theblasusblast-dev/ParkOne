import { Injectable } from '@angular/core';
import { Observable, Subject, filter } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { API_ORIGIN } from './api.config';
import { RealtimeEvent } from './models';

const EVENT_TYPES: RealtimeEvent['type'][] = ['ACCESS_DECIDED', 'SPOTS_CHANGED', 'PAYMENT_CONFIRMED'];

/**
 * Conexión de tiempo real con el backend (Socket.IO). Las pantallas se
 * suscriben a los eventos de una sede: barrera, cambios de espacios y pagos.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private socket: Socket | null = null;
  private siteId: string | null = null;
  private readonly events = new Subject<RealtimeEvent>();

  watchSite(siteId: string): Observable<RealtimeEvent> {
    this.connect();
    if (this.siteId !== siteId) {
      this.siteId = siteId;
      this.socket?.emit('join-site', siteId);
    }
    return this.events.pipe(filter((event) => event.siteId === siteId));
  }

  private connect(): void {
    if (this.socket) return;
    this.socket = io(API_ORIGIN);
    // Al reconectar, vuelve a unirse a la sala de la sede.
    this.socket.on('connect', () => {
      if (this.siteId) this.socket?.emit('join-site', this.siteId);
    });
    for (const type of EVENT_TYPES) {
      this.socket.on(type, (event: RealtimeEvent) => this.events.next(event));
    }
  }
}
