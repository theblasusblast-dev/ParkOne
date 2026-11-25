/** Clasificación de placas (F-02, S-08) y calendario operativo (S-02). */
import { describe, expect, it } from 'vitest';
import { bandOf, operatingDayOf } from '../src/modules/access/domain/operating-calendar';
import { interpretPlate } from '../src/modules/access/domain/plate';
import { at } from './support/parking-world';

describe('Clasificación de placas', () => {
  it.each([
    ['abc 123', 'MANIZALES', 'ABC123', 'CAR'],
    ['ABC12D', 'COLOMBIA', 'ABC12D', 'MOTORCYCLE'],
    ['ABC12', '', 'ABC12', 'MOTORCYCLE'],
    ['A8C123', 'PEREIRA', 'ABC123', 'CAR'],
    ['ABC121', 'COLOMBIA', 'ABC12I', 'MOTORCYCLE'],
    ['ABC121', 'MANIZALES', 'ABC121', 'CAR'],
  ])('"%s" con región "%s" → %s (%s)', (text, region, plate, vehicleType) => {
    expect(interpretPlate(text, region)).toEqual({ kind: 'RECOGNIZED', plate, vehicleType });
  });

  it('pasa al empleado si el formato y la región se contradicen', () => {
    expect(interpretPlate('ABC123', 'COLOMBIA').kind).toBe('CONFLICT');
  });

  it('no reconoce formatos que no son colombianos', () => {
    expect(interpretPlate('12ABCD', '').kind).toBe('UNRECOGNIZED');
    expect(interpretPlate('XYZ9876', '').kind).toBe('UNRECOGNIZED');
  });
});

describe('Calendario operativo', () => {
  it('las 05:59 pertenecen al día operativo anterior y las 06:00 al nuevo', () => {
    expect(operatingDayOf(at('2026-11-24 05:59'), '06:00')).toBe('2026-11-23');
    expect(operatingDayOf(at('2026-11-24 06:00'), '06:00')).toBe('2026-11-24');
  });

  it('la franja diurna va de 06:00 a 17:59 y la nocturna de 18:00 a 05:59', () => {
    expect(bandOf(at('2026-11-23 06:00'), '06:00', '18:00')).toBe('DAY');
    expect(bandOf(at('2026-11-23 17:59'), '06:00', '18:00')).toBe('DAY');
    expect(bandOf(at('2026-11-23 18:00'), '06:00', '18:00')).toBe('NIGHT');
    expect(bandOf(at('2026-11-24 05:59'), '06:00', '18:00')).toBe('NIGHT');
  });
});
