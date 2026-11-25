import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { filter, interval, merge, startWith, switchMap, tap } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { Spot, SpotStatus, VehicleType } from '../../core/models';
import { RealtimeService } from '../../core/realtime.service';
import {
  BAND_LABEL,
  CHARGE_LABEL,
  SPOT_LABEL,
  VEHICLE_LABEL,
  formatCop,
  formatDuration,
} from '../../shared/format';
import { SiteContext } from '../../shared/site-context.service';
import { SitePicker } from '../../shared/site-picker';
import { MapApi } from './map.api';

const REFRESH_MS = 60_000;

/**
 * Mapa de espacios de una sede (HU-14): carros a la izquierda y motos a la
 * derecha, en gris (libre), verde (ocupado) o rojo (inhabilitado). Se
 * actualiza en tiempo real y cada minuto, para el tiempo de uso.
 */
@Component({
  selector: 'app-map',
  imports: [FormsModule, SitePicker],
  templateUrl: './map.html',
})
export class ParkingMap {
  private readonly api = inject(MapApi);
  protected readonly site = inject(SiteContext);

  protected readonly labels = { vehicle: VEHICLE_LABEL, spot: SPOT_LABEL, band: BAND_LABEL, charge: CHARGE_LABEL };
  protected readonly formatCop = formatCop;
  protected readonly formatDuration = formatDuration;

  protected readonly spots = signal<Spot[]>([]);
  protected readonly search = signal('');
  protected readonly statusFilter = signal<SpotStatus | ''>('');
  protected readonly typeFilter = signal<VehicleType | ''>('');
  protected readonly selectedId = signal<string | null>(null);
  protected readonly reason = signal('');
  protected readonly error = signal<string | null>(null);

  protected readonly cars = computed(() => this.visible('CAR'));
  protected readonly motorcycles = computed(() => this.visible('MOTORCYCLE'));
  protected readonly selected = computed(() => this.spots().find((spot) => spot.id === this.selectedId()) ?? null);
  protected readonly summary = computed(() => {
    const count = (type: VehicleType, status: SpotStatus) =>
      this.spots().filter((spot) => spot.vehicleType === type && spot.status === status).length;
    return (['CAR', 'MOTORCYCLE'] as VehicleType[]).map((type) => ({
      type,
      free: count(type, 'FREE'),
      occupied: count(type, 'OCCUPIED'),
      disabled: count(type, 'DISABLED'),
    }));
  });

  constructor() {
    const realtime = inject(RealtimeService);
    toObservable(this.site.siteId)
      .pipe(
        filter((siteId): siteId is string => siteId !== null),
        switchMap((siteId) =>
          merge(
            realtime.watchSite(siteId).pipe(filter((event) => event.type === 'SPOTS_CHANGED' || event.type === 'PAYMENT_CONFIRMED')),
            interval(REFRESH_MS),
          ).pipe(
            startWith(null),
            switchMap(() => this.api.spots(siteId)),
          ),
        ),
        tap({ error: (error) => this.error.set(apiErrorMessage(error)) }),
        takeUntilDestroyed(),
      )
      .subscribe((spots) => this.spots.set(spots));
  }

  /** true si el espacio coincide con la búsqueda de placa (para resaltarlo). */
  protected matches(spot: Spot): boolean {
    const text = this.search().trim().toUpperCase();
    return text !== '' && (spot.occupant?.plate.includes(text) ?? false);
  }

  protected select(spot: Spot): void {
    this.selectedId.set(spot.id === this.selectedId() ? null : spot.id);
    this.reason.set('');
    this.error.set(null);
  }

  protected change(status: 'FREE' | 'DISABLED'): void {
    const spot = this.selected();
    if (!spot) return;
    this.api.changeStatus(spot.id, status, status === 'DISABLED' ? this.reason().trim() || null : null).subscribe({
      next: () => {
        this.reason.set('');
        this.error.set(null);
      },
      error: (error) => this.error.set(apiErrorMessage(error)),
    });
  }

  private visible(type: VehicleType): Spot[] {
    if (this.typeFilter() && this.typeFilter() !== type) return [];
    const status = this.statusFilter();
    return this.spots().filter((spot) => spot.vehicleType === type && (!status || spot.status === status));
  }
}
