import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { apiErrorMessage } from '../../core/api-error';
import { Charge } from '../../core/models';
import { BAND_LABEL, formatCop } from '../../shared/format';
import { SiteContext } from '../../shared/site-context.service';
import { SitePicker } from '../../shared/site-picker';
import { CashierApi } from './cashier.api';

interface PendingItem {
  charge: Charge;
  /**
   * Referencia del pago, creada una sola vez por cobro: si el botón se presiona
   * dos veces o la red reintenta, la API no cobra dos veces (idempotencia).
   */
  reference: string;
}

/** Caja (HU-15): buscar una placa y registrar el pago en efectivo. */
@Component({
  selector: 'app-cashier',
  imports: [FormsModule, SitePicker],
  templateUrl: './cashier.html',
})
export class Cashier {
  private readonly api = inject(CashierApi);
  protected readonly site = inject(SiteContext);
  protected readonly formatCop = formatCop;
  protected readonly bandLabel = BAND_LABEL;

  protected readonly plate = signal('');
  protected readonly searched = signal<string | null>(null);
  protected readonly pending = signal<PendingItem[]>([]);
  protected readonly confirmingId = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  search(): void {
    const siteId = this.site.siteId();
    const plate = this.plate().trim().toUpperCase();
    if (!siteId || !plate) return;

    this.error.set(null);
    this.success.set(null);
    this.confirmingId.set(null);
    this.api.pending(siteId, plate).subscribe({
      next: (charges) => {
        this.searched.set(plate);
        this.pending.set(charges.map((charge) => ({ charge, reference: `CAJA-${crypto.randomUUID()}` })));
      },
      error: (error) => this.error.set(apiErrorMessage(error)),
    });
  }

  pay(item: PendingItem): void {
    this.busy.set(true);
    this.api.pay(item.charge.id, item.charge.amountCop, item.reference).subscribe({
      next: (result) => {
        const until = new Date(result.passValidUntil).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
        this.success.set(
          `Pago de ${formatCop(result.charge.amountCop)} registrado para ${result.charge.plate}. Pase vigente hasta el ${until}.`,
        );
        this.pending.update((list) => list.filter((candidate) => candidate.charge.id !== item.charge.id));
        this.confirmingId.set(null);
        this.busy.set(false);
      },
      error: (error) => {
        this.error.set(apiErrorMessage(error));
        this.busy.set(false);
      },
    });
  }
}
