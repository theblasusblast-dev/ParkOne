/**
 * Los 9 escenarios de la sección 6 del documento de contexto (01), con el día
 * operativo de 06:00 a 05:59 y las franjas diurna (06:00) y nocturna (18:00).
 * Tarifas de prueba: carro $8.000 diurno y $5.000 nocturno; moto $0.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createParkingWorld } from './support/parking-world';

describe('Escenarios del documento de contexto', () => {
  let world: ReturnType<typeof createParkingWorld>;

  beforeEach(() => {
    world = createParkingWorld();
  });

  it('1. Una moto entra a las 10:00 y sale a las 14:00 sin cobro', async () => {
    world.setTime('2026-11-23 10:00');
    const entry = await world.enter('MOT12A', 'MOTORCYCLE');
    expect(entry.outcome).toBe('ADMITTED');
    expect(entry.charge).toBeNull();

    world.setTime('2026-11-23 14:00');
    const exit = await world.exit('MOT12A');
    expect(exit.barrierOpened).toBe(true);
    expect(world.chargesOf('MOT12A')).toHaveLength(0);
  });

  it('2. Un carro que entra por primera vez a las 08:00 queda con cobro diurno pendiente', async () => {
    world.setTime('2026-11-23 08:00');
    const entry = await world.enter('ABC123');
    expect(entry.charge).toMatchObject({ band: 'DAY', amountCop: 8000, status: 'PENDING' });

    const exit = await world.exit('ABC123');
    expect(exit.barrierOpened).toBe(false);
  });

  it('3. El mismo carro pagó, sale a las 12:00 y vuelve a las 15:00 sin cobro nuevo', async () => {
    world.setTime('2026-11-23 08:00');
    await world.enter('ABC123');
    await world.payAll('ABC123');

    world.setTime('2026-11-23 12:00');
    expect((await world.exit('ABC123')).barrierOpened).toBe(true);

    world.setTime('2026-11-23 15:00');
    const reentry = await world.enter('ABC123');
    expect(reentry.reentry).toBe(true);
    expect(world.chargesOf('ABC123')).toHaveLength(1);
  });

  it('4. El mismo carro vuelve a las 22:00: sigue el mismo día operativo, sin cobro', async () => {
    world.setTime('2026-11-23 08:00');
    await world.enter('ABC123');
    await world.payAll('ABC123');
    await world.exit('ABC123');

    world.setTime('2026-11-23 22:00');
    const reentry = await world.enter('ABC123');
    expect(reentry.reentry).toBe(true);
    expect(world.chargesOf('ABC123')).toHaveLength(1);
  });

  it('5. Un carro que entra por primera vez a las 19:00 paga la nocturna, menor que la diurna', async () => {
    world.setTime('2026-11-23 19:00');
    const entry = await world.enter('NOC555');
    expect(entry.charge).toMatchObject({ band: 'NIGHT', amountCop: 5000 });
    expect(entry.charge!.amountCop).toBeLessThan(8000);
  });

  it('6. Un carro entra a las 23:00 y sale a la 01:00: un solo cobro nocturno', async () => {
    world.setTime('2026-11-23 23:00');
    await world.enter('MED001');
    await world.payAll('MED001');

    world.setTime('2026-11-24 01:00');
    const exit = await world.exit('MED001');
    expect(exit.barrierOpened).toBe(true);
    expect(world.chargesOf('MED001')).toEqual([
      expect.objectContaining({ band: 'NIGHT', operatingDay: '2026-11-23', status: 'PAID' }),
    ]);
  });

  it('7. Entra a las 05:50, paga la nocturna y se queda hasta las 09:00: se genera el cobro diurno del día nuevo', async () => {
    world.setTime('2026-11-23 05:50');
    const entry = await world.enter('MAD550');
    expect(entry.charge).toMatchObject({ band: 'NIGHT', operatingDay: '2026-11-22' });
    await world.payAll('MAD550');

    world.setTime('2026-11-23 09:00');
    const exit = await world.exit('MAD550');
    expect(exit.barrierOpened).toBe(false);
    expect(exit.pendingCharges).toEqual([
      expect.objectContaining({ band: 'DAY', operatingDay: '2026-11-23', amountCop: 8000 }),
    ]);

    await world.payAll('MAD550');
    expect((await world.exit('MAD550')).barrierOpened).toBe(true);
  });

  it('8. Pagó el lunes y vuelve el martes a las 07:00: cobro diurno nuevo', async () => {
    world.setTime('2026-11-23 08:00');
    await world.enter('LUN123');
    await world.payAll('LUN123');
    await world.exit('LUN123');

    world.setTime('2026-11-24 07:00');
    const entry = await world.enter('LUN123');
    expect(entry.reentry).toBe(false);
    expect(entry.charge).toMatchObject({ band: 'DAY', operatingDay: '2026-11-24', status: 'PENDING' });
    expect(world.chargesOf('LUN123')).toHaveLength(2);
  });

  it('9. La cámara no logra leer la placa: el empleado la digita y queda como lectura manual', async () => {
    for (const attempt of [1, 2]) {
      expect(world.readPlate.execute({ text: 'ABC123', region: 'BOGOTA', confidence: 0.4, attempt }).outcome).toBe('RETRY');
    }
    expect(world.readPlate.execute({ text: 'ABC123', region: 'BOGOTA', confidence: 0.4, attempt: 3 }).outcome).toBe('MANUAL_REVIEW');

    const entry = await world.enterManually('ABC123', 'CAR');
    expect(entry.outcome).toBe('ADMITTED');
    expect(world.store.events.at(-1)).toMatchObject({ manualRead: true, operatorId: 'employee-1' });
  });
});
