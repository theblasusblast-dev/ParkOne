import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { filter, firstValueFrom, switchMap } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { AccessResult, VehicleType } from '../../core/models';
import { RealtimeService } from '../../core/realtime.service';
import { SiteContext } from '../../shared/site-context.service';
import { SitePicker } from '../../shared/site-picker';
import { LaneApi } from './lane.api';

type Direction = 'ENTRY' | 'EXIT';
type ScreenState = 'IDLE' | 'READING' | 'OPEN' | 'CLOSED' | 'MANUAL';
type QualityKey = 'CLEAR' | 'DIRTY' | 'NIGHT';

/**
 * Calidad de la imagen simulada. La confianza mejora un poco en cada intento,
 * como pasaría con fotogramas distintos: "sucia" se reconoce al tercer intento
 * y "nocturna" nunca llega al umbral, así que pasa al empleado.
 */
const QUALITIES: Record<QualityKey, { label: string; confidence: number; improves: number }> = {
  CLEAR: { label: 'Nítida', confidence: 0.95, improves: 0 },
  DIRTY: { label: 'Sucia', confidence: 0.68, improves: 0.07 },
  NIGHT: { label: 'Nocturna', confidence: 0.4, improves: 0.05 },
};

const SAMPLES = [
  { label: 'Carro', plate: 'ABC123', region: 'MANIZALES' },
  { label: 'Moto', plate: 'MOT12A', region: 'COLOMBIA' },
  { label: 'Ambigua 1/I', plate: 'XYZ121', region: 'COLOMBIA' },
  { label: 'Contradicción', plate: 'QWE456', region: 'COLOMBIA' },
];

const ATTEMPT_DELAY_MS = 2500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Activity {
  time: Date;
  text: string;
  ok: boolean;
}

/** Pantalla del carril: cámara simulada a la izquierda y barrera a la derecha (HU-13). */
@Component({
  selector: 'app-lane',
  imports: [FormsModule, SitePicker],
  templateUrl: './lane.html',
})
export class Lane {
  private readonly api = inject(LaneApi);
  protected readonly site = inject(SiteContext);

  protected readonly qualities = Object.entries(QUALITIES) as [QualityKey, (typeof QUALITIES)[QualityKey]][];
  protected readonly samples = SAMPLES;

  protected readonly direction = signal<Direction>('ENTRY');
  protected readonly plate = signal('ABC123');
  protected readonly region = signal('MANIZALES');
  protected readonly quality = signal<QualityKey>('CLEAR');

  protected readonly state = signal<ScreenState>('IDLE');
  protected readonly message = signal('Esperando vehículo');
  protected readonly full = signal(false);
  protected readonly busy = signal(false);

  protected readonly manualPlate = signal('');
  protected readonly manualType = signal<VehicleType>('CAR');
  protected readonly manualForeign = signal(false);

  protected readonly activity = signal<Activity[]>([]);

  constructor() {
    const realtime = inject(RealtimeService);
    toObservable(this.site.siteId)
      .pipe(
        filter((siteId): siteId is string => siteId !== null),
        switchMap((siteId) => realtime.watchSite(siteId)),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        if (event.type === 'ACCESS_DECIDED') {
          const way = event.direction === 'ENTRY' ? 'Entrada' : 'Salida';
          this.log(`${way} ${event.plate}: ${event.message}`, event.barrierOpened);
        } else if (event.type === 'PAYMENT_CONFIRMED') {
          this.log(`Pago confirmado de ${event.plate}`, true);
        }
      });
  }

  useSample(sample: (typeof SAMPLES)[number]): void {
    this.plate.set(sample.plate);
    this.region.set(sample.region);
  }

  /** Simula la llegada del vehículo: hasta 3 lecturas y luego la decisión de la barrera. */
  async pass(): Promise<void> {
    const siteId = this.site.siteId();
    if (!siteId || this.busy()) return;
    this.busy.set(true);
    this.full.set(false);
    this.state.set('READING');

    try {
      const quality = QUALITIES[this.quality()];
      for (let attempt = 1; attempt <= 3; attempt++) {
        this.message.set(`Reconociendo… intento ${attempt} de 3`);
        await sleep(ATTEMPT_DELAY_MS);

        const confidence = Math.min(1, quality.confidence + quality.improves * (attempt - 1));
        const decision = await firstValueFrom(
          this.api.readPlate({ text: this.plate(), region: this.region(), confidence, attempt }),
        );

        if (decision.outcome === 'ACCEPTED' && decision.plate && decision.vehicleType) {
          const result =
            this.direction() === 'ENTRY'
              ? await firstValueFrom(
                  this.api.enter({ siteId, plate: decision.plate, vehicleType: decision.vehicleType, confidence, region: this.region() }),
                )
              : await firstValueFrom(this.api.exit({ siteId, plate: decision.plate }));
          this.show(result);
          return;
        }

        if (decision.outcome === 'MANUAL_REVIEW') {
          this.state.set('MANUAL');
          this.message.set(decision.message);
          this.manualPlate.set(decision.plate ?? this.plate().toUpperCase());
          this.manualForeign.set(false);
          return;
        }
      }
    } catch (error) {
      this.state.set('CLOSED');
      this.message.set(apiErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  /** El empleado confirma o digita la placa (F-06). */
  async submitManual(): Promise<void> {
    const siteId = this.site.siteId();
    if (!siteId || !this.manualPlate().trim()) return;
    this.busy.set(true);
    try {
      const result =
        this.direction() === 'ENTRY'
          ? await firstValueFrom(
              this.api.enterManual({
                siteId,
                plate: this.manualPlate(),
                vehicleType: this.manualType(),
                foreignPlate: this.manualForeign(),
              }),
            )
          : await firstValueFrom(this.api.exit({ siteId, plate: this.manualPlate() }));
      this.show(result);
    } catch (error) {
      this.message.set(apiErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  reset(): void {
    this.state.set('IDLE');
    this.full.set(false);
    this.message.set('Esperando vehículo');
  }

  private show(result: AccessResult): void {
    this.state.set(result.barrierOpened ? 'OPEN' : 'CLOSED');
    this.full.set(result.outcome === 'FULL');
    this.message.set(result.message);
  }

  private log(text: string, ok: boolean): void {
    this.activity.update((list) => [{ time: new Date(), text, ok }, ...list].slice(0, 8));
  }
}
