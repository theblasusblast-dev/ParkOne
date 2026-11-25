import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth/auth.service';
import { SiteContext } from './site-context.service';

/** Selector de sede: el administrador elige; el empleado solo ve el nombre de la suya. */
@Component({
  selector: 'app-site-picker',
  template: `
    @if (auth.isAdmin()) {
      <select class="site-select" [value]="site.siteId()" (change)="site.choose($any($event.target).value)">
        @for (option of site.sites(); track option.id) {
          <option [value]="option.id">{{ option.name }} · {{ option.city }}</option>
        }
      </select>
    } @else {
      <span class="badge">{{ site.siteName() }}</span>
    }
  `,
})
export class SitePicker {
  protected readonly auth = inject(AuthService);
  protected readonly site = inject(SiteContext);

  constructor() {
    this.site.load();
  }
}
