import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { apiErrorMessage } from '../../core/api-error';
import { Employee, SiteSummary } from '../../core/models';
import { AdminApi } from './admin.api';

/** Empleados (HU-16): crear, cambiar de sede y activar o desactivar. */
@Component({
  selector: 'app-admin-employees',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-employees.html',
})
export class AdminEmployees {
  private readonly api = inject(AdminApi);

  protected readonly employees = signal<Employee[]>([]);
  protected readonly sites = signal<SiteSummary[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    siteId: ['', Validators.required],
  });

  constructor() {
    this.api.sites().subscribe((sites) => this.sites.set(sites));
    this.reload();
  }

  protected create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.api.createEmployee(this.form.getRawValue()).subscribe({
      next: (employee) => {
        this.done(`Empleado ${employee.fullName} creado en ${employee.site.name}. Ya puede iniciar sesión.`);
        this.form.reset();
      },
      error: (error) => this.fail(error),
    });
  }

  protected moveTo(employee: Employee, siteId: string): void {
    this.api.updateEmployee(employee.id, { siteId }).subscribe({
      next: (updated) => this.done(`${updated.fullName} ahora trabaja en ${updated.site.name}.`),
      error: (error) => this.fail(error),
    });
  }

  protected toggle(employee: Employee): void {
    this.api.updateEmployee(employee.id, { active: !employee.active }).subscribe({
      next: (updated) => this.done(`${updated.fullName} quedó ${updated.active ? 'activo' : 'desactivado: ya no puede ingresar'}.`),
      error: (error) => this.fail(error),
    });
  }

  private done(message: string): void {
    this.error.set(null);
    this.success.set(message);
    this.reload();
  }

  private fail(error: unknown): void {
    this.success.set(null);
    this.error.set(apiErrorMessage(error));
  }

  private reload(): void {
    this.api.employees().subscribe((employees) => this.employees.set(employees));
  }
}
