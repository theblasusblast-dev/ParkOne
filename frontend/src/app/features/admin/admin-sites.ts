import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { apiErrorMessage } from '../../core/api-error';
import { SiteSummary } from '../../core/models';
import { SiteContext } from '../../shared/site-context.service';
import { AdminApi } from './admin.api';
import { DEPARTMENTS } from './departments';

/** Sedes (HU-16): lista con ocupación y creación con su número de espacios. */
@Component({
  selector: 'app-admin-sites',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-sites.html',
})
export class AdminSites {
  private readonly api = inject(AdminApi);
  private readonly siteContext = inject(SiteContext);
  protected readonly departments = DEPARTMENTS;

  protected readonly sites = signal<SiteSummary[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    department: ['', Validators.required],
    city: ['', Validators.required],
    carSpots: [10, [Validators.required, Validators.min(0), Validators.max(200)]],
    motorcycleSpots: [6, [Validators.required, Validators.min(0), Validators.max(200)]],
  });

  constructor() {
    this.reload();
  }

  protected create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.api.createSite(this.form.getRawValue()).subscribe({
      next: (site) => {
        this.success.set(`Sede "${site.name}" creada con ${site.capacity.CAR.total + site.capacity.MOTORCYCLE.total} espacios.`);
        this.form.reset();
        this.reload();
        this.siteContext.load();
      },
      error: (error) => {
        this.success.set(null);
        this.error.set(apiErrorMessage(error));
      },
    });
  }

  private reload(): void {
    this.api.sites().subscribe({
      next: (sites) => this.sites.set(sites),
      error: (error) => this.error.set(apiErrorMessage(error)),
    });
  }
}
