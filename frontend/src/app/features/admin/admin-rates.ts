import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { Rate, SiteRates, VehicleType } from '../../core/models';
import { BAND_LABEL, VEHICLE_LABEL, formatCop } from '../../shared/format';
import { SiteContext } from '../../shared/site-context.service';
import { SitePicker } from '../../shared/site-picker';
import { AdminApi } from './admin.api';

type RateForm = Record<VehicleType, { day: number; night: number }>;

/** Tarifas y franjas (HU-16): solo el administrador las configura (punto 7.3). */
@Component({
  selector: 'app-admin-rates',
  imports: [FormsModule, SitePicker],
  templateUrl: './admin-rates.html',
})
export class AdminRates {
  private readonly api = inject(AdminApi);
  protected readonly site = inject(SiteContext);
  protected readonly labels = { vehicle: VEHICLE_LABEL, band: BAND_LABEL };
  protected readonly formatCop = formatCop;
  protected readonly types: VehicleType[] = ['CAR', 'MOTORCYCLE'];

  protected readonly rates = signal<RateForm>({ CAR: { day: 0, night: 0 }, MOTORCYCLE: { day: 0, night: 0 } });
  protected readonly bands = signal({ dayBandStart: '06:00', nightBandStart: '18:00' });
  protected readonly history = signal<Rate[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);

  constructor() {
    toObservable(this.site.siteId)
      .pipe(
        filter((siteId): siteId is string => siteId !== null),
        takeUntilDestroyed(),
      )
      .subscribe((siteId) => this.load(siteId));
  }

  protected setRate(type: VehicleType, band: 'day' | 'night', value: number): void {
    this.rates.update((rates) => ({ ...rates, [type]: { ...rates[type], [band]: Number(value) } }));
  }

  protected setBand(key: 'dayBandStart' | 'nightBandStart', value: string): void {
    this.bands.update((bands) => ({ ...bands, [key]: value }));
  }

  protected saveRates(): void {
    const siteId = this.site.siteId();
    if (!siteId) return;
    const rates = this.types.map((type) => ({
      vehicleType: type,
      dayAmountCop: this.rates()[type].day,
      nightAmountCop: this.rates()[type].night,
    }));
    this.api.updateRates(siteId, rates).subscribe({
      next: (view) => {
        this.fill(view);
        this.ok('Tarifas guardadas. Los cobros ya generados conservan su valor.');
        this.loadHistory(siteId);
      },
      error: (error) => this.fail(error),
    });
  }

  protected saveBands(): void {
    const siteId = this.site.siteId();
    if (!siteId) return;
    this.api.updateBands(siteId, this.bands()).subscribe({
      next: () => this.ok('Franjas guardadas.'),
      error: (error) => this.fail(error),
    });
  }

  private load(siteId: string): void {
    this.error.set(null);
    this.success.set(null);
    this.api.rates(siteId).subscribe({ next: (view) => this.fill(view), error: (error) => this.fail(error) });
    this.loadHistory(siteId);
  }

  private loadHistory(siteId: string): void {
    this.api.rateHistory(siteId).subscribe((history) => this.history.set(history));
  }

  private fill(view: SiteRates): void {
    const amount = (type: VehicleType, band: 'DAY' | 'NIGHT') =>
      view.rates.find((rate) => rate.vehicleType === type && rate.band === band)?.amountCop ?? 0;
    this.rates.set({
      CAR: { day: amount('CAR', 'DAY'), night: amount('CAR', 'NIGHT') },
      MOTORCYCLE: { day: amount('MOTORCYCLE', 'DAY'), night: amount('MOTORCYCLE', 'NIGHT') },
    });
    this.bands.set({ dayBandStart: view.dayBandStart, nightBandStart: view.nightBandStart });
  }

  private ok(message: string): void {
    this.error.set(null);
    this.success.set(message);
  }

  private fail(error: unknown): void {
    this.success.set(null);
    this.error.set(apiErrorMessage(error));
  }
}
