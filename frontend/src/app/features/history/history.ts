import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { ChargeRow, EventRow, Page, PaymentRow } from '../../core/models';
import { BAND_LABEL, CHARGE_LABEL, VEHICLE_LABEL, formatCop } from '../../shared/format';
import { SiteContext } from '../../shared/site-context.service';
import { SitePicker } from '../../shared/site-picker';
import { HistoryApi, HistoryParams } from './history.api';

type Tab = 'events' | 'charges' | 'payments';

const PAGE_SIZE = 15;

/** Historial de la sede (HU-17): ingresos y salidas, cobros y pagos con filtros. */
@Component({
  selector: 'app-history',
  imports: [FormsModule, SitePicker],
  templateUrl: './history.html',
})
export class History {
  private readonly api = inject(HistoryApi);
  protected readonly site = inject(SiteContext);
  protected readonly labels = { vehicle: VEHICLE_LABEL, band: BAND_LABEL, charge: CHARGE_LABEL };
  protected readonly formatCop = formatCop;

  protected readonly tab = signal<Tab>('events');
  protected readonly plate = signal('');
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly status = signal('');
  protected readonly band = signal('');
  protected readonly page = signal(1);

  protected readonly events = signal<Page<EventRow> | null>(null);
  protected readonly charges = signal<Page<ChargeRow> | null>(null);
  protected readonly payments = signal<Page<PaymentRow> | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly current = computed(() => ({ events: this.events(), charges: this.charges(), payments: this.payments() })[this.tab()]);
  protected readonly pages = computed(() => {
    const page = this.current();
    return page ? Math.max(1, Math.ceil(page.total / page.pageSize)) : 1;
  });

  constructor() {
    // Consulta de nuevo solo al cambiar de sede o de pestaña; los filtros se
    // aplican con el botón Filtrar (untracked evita consultar con cada tecla).
    effect(() => {
      this.site.siteId();
      this.tab();
      untracked(() => this.search(1));
    });
  }

  protected setTab(tab: Tab): void {
    this.tab.set(tab);
  }

  protected search(page = 1): void {
    const siteId = this.site.siteId();
    if (!siteId) return;
    if (this.from() && this.to() && this.from() > this.to()) {
      this.error.set('La fecha inicial no puede ser posterior a la final.');
      return;
    }
    this.error.set(null);
    this.page.set(page);

    const params: HistoryParams = { siteId, page, pageSize: PAGE_SIZE };
    if (this.plate().trim()) params['plate'] = this.plate().trim().toUpperCase();
    if (this.from()) params['from'] = this.from();
    if (this.to()) params['to'] = this.to();

    const tab = this.tab();
    if (tab === 'events') this.load(this.api.events(params), this.events);
    if (tab === 'payments') this.load(this.api.payments(params), this.payments);
    if (tab === 'charges') {
      if (this.status()) params['status'] = this.status();
      if (this.band()) params['band'] = this.band();
      this.load(this.api.charges(params), this.charges);
    }
  }

  protected date(value: string): string {
    return new Date(value).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  }

  private load<T>(request: Observable<Page<T>>, target: { set(value: Page<T>): void }): void {
    request.subscribe({
      next: (page) => target.set(page),
      error: (error) => this.error.set(apiErrorMessage(error)),
    });
  }
}
