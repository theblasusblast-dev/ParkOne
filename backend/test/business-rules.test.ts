/** Reglas exigidas en el enunciado, además de los 9 escenarios. */
import { describe, expect, it } from 'vitest';
import { respectsNightDiscount } from '../src/modules/rates/domain/rate';
import { UpdateSiteRatesUseCase } from '../src/modules/rates/application/site-rates.use-cases';
import type { RateRepository } from '../src/modules/rates/application/ports';
import { EMPLOYEE, createParkingWorld } from './support/parking-world';

describe('RN-02: la tarifa nocturna siempre es menor que la diurna', () => {
  it('acepta una nocturna menor y una moto en $0', () => {
    expect(respectsNightDiscount({ vehicleType: 'CAR', dayAmountCop: 8000, nightAmountCop: 5000 })).toBe(true);
    expect(respectsNightDiscount({ vehicleType: 'MOTORCYCLE', dayAmountCop: 0, nightAmountCop: 0 })).toBe(true);
  });

  it('rechaza una nocturna mayor o igual a la diurna', async () => {
    const rates: RateRepository = {
      findBands: async () => ({ dayBandStart: '06:00', nightBandStart: '18:00' }),
      currentRates: async () => [],
      history: async () => [],
      replace: async () => {},
      updateBands: async (_siteId, bands) => bands,
    };
    const update = new UpdateSiteRatesUseCase(rates, { now: () => new Date() });
    const admin = { ...EMPLOYEE, role: 'ADMIN' as const, site: null };

    for (const night of [6000, 5000]) {
      await expect(
        update.execute(admin, 'site-1', [{ vehicleType: 'CAR', dayAmountCop: 5000, nightAmountCop: night }]),
      ).rejects.toMatchObject({ status: 400, code: 'RATE_RULE_VIOLATION' });
    }
  });
});

describe('RN-04: un solo cobro por placa, sede y día operativo', () => {
  it('el reingreso del mismo día no genera un segundo cobro', async () => {
    const world = createParkingWorld();
    world.setTime('2026-11-23 08:00');
    await world.enter('DUP123');
    await world.payAll('DUP123');
    await world.exit('DUP123');

    world.setTime('2026-11-23 10:00');
    await world.enter('DUP123');
    expect(world.chargesOf('DUP123')).toHaveLength(1);
  });

  it('la restricción de la base de datos rechaza un segundo cobro aunque se intente crear', () => {
    const world = createParkingWorld();
    const charge = { operatingDay: '2026-11-23', band: 'DAY' as const, rateId: 'car-day', amountCop: 8000 };
    world.store.insertCharge('DUP123', 'CAR', charge);
    expect(() => world.store.insertCharge('DUP123', 'CAR', charge)).toThrow(/Unique constraint/);
  });
});

describe('Idempotencia del pago', () => {
  it('pagar dos veces con la misma referencia registra un solo pago', async () => {
    const world = createParkingWorld();
    world.setTime('2026-11-23 08:00');
    const entry = await world.enter('IDE123');
    const chargeId = entry.charge!.id;

    const first = await world.pay(chargeId, 8000, 'CAJA-0001');
    const second = await world.pay(chargeId, 8000, 'CAJA-0001');

    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.payment.id).toBe(first.payment.id);
    expect(world.store.payments).toHaveLength(1);
  });

  it('un cobro ya pagado no se paga con otra referencia', async () => {
    const world = createParkingWorld();
    const entry = await world.enter('IDE456');
    await world.pay(entry.charge!.id, 8000, 'CAJA-0002');
    await expect(world.pay(entry.charge!.id, 8000, 'CAJA-0003')).rejects.toMatchObject({ code: 'CHARGE_ALREADY_PAID' });
  });
});

describe('Cupos y anti-passback', () => {
  it('sin espacios libres responde LLENO, no abre y no genera cobro', async () => {
    const world = createParkingWorld();
    await world.enter('AAA111');
    await world.enter('BBB222');
    const full = await world.enter('CCC333');
    expect(full).toMatchObject({ outcome: 'FULL', barrierOpened: false, charge: null });
    expect(world.chargesOf('CCC333')).toHaveLength(0);
  });

  it('una placa que ya está adentro no puede volver a entrar', async () => {
    const world = createParkingWorld();
    await world.enter('ABC123');
    const again = await world.enter('ABC123');
    expect(again).toMatchObject({ outcome: 'ALREADY_INSIDE', barrierOpened: false });
  });
});
