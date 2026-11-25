/**
 * Mundo de prueba: un parqueadero en memoria con reloj controlable.
 * Implementa los mismos puertos que Prisma, así los casos de uso reales se
 * prueban sin base de datos y simulando cualquier hora (inversión de dependencias).
 */
import type { AccessEventData, AccessRepository, NewCharge, Occupancy, SpotRef } from '../../src/modules/access/application/ports';
import { ReadPlateUseCase } from '../../src/modules/access/application/read-plate.use-case';
import { RegisterEntryUseCase } from '../../src/modules/access/application/register-entry.use-case';
import { RegisterExitUseCase } from '../../src/modules/access/application/register-exit.use-case';
import { RegisterManualEntryUseCase } from '../../src/modules/access/application/register-manual-entry.use-case';
import type { PublicProfile } from '../../src/modules/auth/domain/user-account';
import { PayChargeUseCase } from '../../src/modules/billing/application/billing.use-cases';
import type { BillingRepository, ChargeRecord, NewPayment, PaymentRecord } from '../../src/modules/billing/application/ports';
import type { Charge } from '../../src/modules/billing/domain/charge';
import type { Band } from '../../src/shared/domain/band';
import type { VehicleType } from '../../src/shared/domain/vehicle-type';

export const SITE = 'site-1';

interface StoredSpot extends SpotRef {
  vehicleType: VehicleType;
  plate: string | null;
  since: Date | null;
}

type StoredCharge = ChargeRecord & { vehicleType: VehicleType };

/** Estado compartido por los dos repositorios en memoria. */
class ParkingStore {
  schedule = { dayBandStart: '06:00', nightBandStart: '18:00' };
  rates = [
    { id: 'car-day', vehicleType: 'CAR' as VehicleType, band: 'DAY' as Band, amountCop: 8000 },
    { id: 'car-night', vehicleType: 'CAR' as VehicleType, band: 'NIGHT' as Band, amountCop: 5000 },
    { id: 'moto-day', vehicleType: 'MOTORCYCLE' as VehicleType, band: 'DAY' as Band, amountCop: 0 },
    { id: 'moto-night', vehicleType: 'MOTORCYCLE' as VehicleType, band: 'NIGHT' as Band, amountCop: 0 },
  ];
  spots: StoredSpot[] = [
    { id: 'c1', code: 'C-01', vehicleType: 'CAR', plate: null, since: null },
    { id: 'c2', code: 'C-02', vehicleType: 'CAR', plate: null, since: null },
    { id: 'm1', code: 'M-01', vehicleType: 'MOTORCYCLE', plate: null, since: null },
  ];
  charges: StoredCharge[] = [];
  payments: PaymentRecord[] = [];
  events: AccessEventData[] = [];

  /** Igual que la restricción única de PostgreSQL (placa, sede, día operativo): RN-04. */
  insertCharge(plate: string, vehicleType: VehicleType, charge: NewCharge): Charge {
    if (this.charges.some((c) => c.plate === plate && c.siteId === SITE && c.operatingDay === charge.operatingDay)) {
      throw new Error('Unique constraint failed on (plate, siteId, operatingDay)');
    }
    const stored: StoredCharge = {
      id: `charge-${this.charges.length + 1}`,
      siteId: SITE,
      plate,
      vehicleType,
      operatingDay: charge.operatingDay,
      band: charge.band,
      amountCop: charge.amountCop,
      status: 'PENDING',
    };
    this.charges.push(stored);
    return stored;
  }
}

class InMemoryAccess implements AccessRepository {
  constructor(private readonly store: ParkingStore) {}

  async findSchedule() {
    return this.store.schedule;
  }
  async findOccupancy(_siteId: string, plate: string): Promise<Occupancy | null> {
    const spot = this.store.spots.find((s) => s.plate === plate);
    return spot ? { spot: { id: spot.id, code: spot.code }, vehicleType: spot.vehicleType, since: spot.since! } : null;
  }
  async findFreeSpot(_siteId: string, vehicleType: VehicleType) {
    const spot = this.store.spots.find((s) => s.vehicleType === vehicleType && s.plate === null);
    return spot ? { id: spot.id, code: spot.code } : null;
  }
  async findCharge(_siteId: string, plate: string, operatingDay: string) {
    return this.store.charges.find((c) => c.plate === plate && c.operatingDay === operatingDay) ?? null;
  }
  async findCurrentRate(_siteId: string, vehicleType: VehicleType, band: Band) {
    return this.store.rates.find((r) => r.vehicleType === vehicleType && r.band === band) ?? null;
  }
  async admit(spotId: string, event: AccessEventData, newCharge: NewCharge | null) {
    const spot = this.store.spots.find((s) => s.id === spotId)!;
    spot.plate = event.plate;
    spot.since = event.occurredAt;
    const charge = newCharge ? this.store.insertCharge(event.plate, event.vehicleType, newCharge) : null;
    this.store.events.push(event);
    return { eventId: `event-${this.store.events.length}`, charge };
  }
  async recordEvent(event: AccessEventData) {
    this.store.events.push(event);
    return `event-${this.store.events.length}`;
  }
  async findPendingCharges(_siteId: string, plate: string) {
    return this.store.charges.filter((c) => c.plate === plate && c.status === 'PENDING');
  }
  async createCharge(_siteId: string, plate: string, vehicleType: VehicleType, charge: NewCharge) {
    return this.store.insertCharge(plate, vehicleType, charge);
  }
  async release(spotId: string, event: AccessEventData) {
    const spot = this.store.spots.find((s) => s.id === spotId)!;
    spot.plate = null;
    spot.since = null;
    this.store.events.push(event);
    return `event-${this.store.events.length}`;
  }
}

class InMemoryBilling implements BillingRepository {
  constructor(private readonly store: ParkingStore) {}

  async findPendingByPlate(_siteId: string, plate: string) {
    return this.store.charges.filter((c) => c.plate === plate && c.status === 'PENDING');
  }
  async findCharge(id: string) {
    return this.store.charges.find((c) => c.id === id) ?? null;
  }
  async findPaymentByReference(reference: string) {
    return this.store.payments.find((p) => p.reference === reference) ?? null;
  }
  async findDayBandStart() {
    return this.store.schedule.dayBandStart;
  }
  async recordPayment(payment: NewPayment): Promise<PaymentRecord> {
    const charge = this.store.charges.find((c) => c.id === payment.chargeId)!;
    charge.status = 'PAID';
    const record: PaymentRecord = {
      id: `payment-${this.store.payments.length + 1}`,
      chargeId: payment.chargeId,
      amountCop: payment.amountCop,
      reference: payment.reference,
      paidAt: payment.paidAt,
      receivedBy: { id: payment.receivedById, fullName: 'Empleado de prueba' },
    };
    this.store.payments.push(record);
    return record;
  }
}

export const EMPLOYEE: PublicProfile = {
  id: 'employee-1',
  fullName: 'Empleado de prueba',
  email: 'empleado@parkone.co',
  role: 'EMPLOYEE',
  site: { id: SITE, name: 'Sede de prueba' },
};

/** Fecha y hora de Bogotá: at('2026-11-23 08:00'). */
export const at = (localDateTime: string) => new Date(`${localDateTime.replace(' ', 'T')}:00-05:00`);

/** Arma el parqueadero de prueba con su reloj y los casos de uso reales. */
export function createParkingWorld() {
  const store = new ParkingStore();
  let now = at('2026-11-23 08:00');
  const clock = { now: () => now };
  const events = { publish: () => {} };
  const access = new InMemoryAccess(store);

  const entry = new RegisterEntryUseCase(access, clock, events);
  const exit = new RegisterExitUseCase(access, clock, events);
  const manualEntry = new RegisterManualEntryUseCase(entry);
  const pay = new PayChargeUseCase(new InMemoryBilling(store), events, clock);

  return {
    store,
    readPlate: new ReadPlateUseCase(0.8),
    setTime(localDateTime: string) {
      now = at(localDateTime);
    },
    enter(plate: string, vehicleType: VehicleType = 'CAR') {
      return entry.execute(EMPLOYEE, { siteId: SITE, plate, vehicleType, confidence: 0.95, region: null, manualRead: false, foreignPlate: false });
    },
    enterManually(plate: string, vehicleType: VehicleType, foreignPlate = false) {
      return manualEntry.execute(EMPLOYEE, { siteId: SITE, plate, vehicleType, foreignPlate });
    },
    exit(plate: string) {
      return exit.execute(EMPLOYEE, { siteId: SITE, plate });
    },
    /** Paga todos los cobros pendientes de la placa. */
    async payAll(plate: string) {
      for (const charge of store.charges.filter((c) => c.plate === plate && c.status === 'PENDING')) {
        await pay.execute(EMPLOYEE, charge.id, { amountCop: charge.amountCop, reference: `REF-${charge.id}` });
      }
    },
    pay(chargeId: string, amountCop: number, reference: string) {
      return pay.execute(EMPLOYEE, chargeId, { amountCop, reference });
    },
    chargesOf(plate: string) {
      return store.charges.filter((c) => c.plate === plate);
    },
  };
}
