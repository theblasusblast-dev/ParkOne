import type { VehicleType } from '../../../shared/domain/vehicle-type';

/**
 * Interpretación de una placa colombiana leída por la cámara.
 *
 *   Carro: AAA123   ·   Moto: AAA12A, o AAA12 en placas antiguas
 *
 * La cámara confunde algunos caracteres (0/O, 1/I, 8/B, 5/S, 2/Z). Como cada
 * posición solo admite letras o solo dígitos, se corrigen según la posición.
 * Si el último carácter es ambiguo, decide la región impresa en la placa:
 * "COLOMBIA" indica moto; un municipio o ciudad indica carro (supuesto S-08).
 */
export type PlateInterpretation =
  | { kind: 'RECOGNIZED'; plate: string; vehicleType: VehicleType }
  | { kind: 'CONFLICT'; plate: string }
  | { kind: 'UNRECOGNIZED' };

const LETTER_FOR_DIGIT: Record<string, string> = { '0': 'O', '1': 'I', '8': 'B', '5': 'S', '2': 'Z' };
const DIGIT_FOR_LETTER: Record<string, string> = { O: '0', I: '1', B: '8', S: '5', Z: '2' };

const asLetter = (char: string) => LETTER_FOR_DIGIT[char] ?? char;
const asDigit = (char: string) => DIGIT_FOR_LETTER[char] ?? char;
const isLetter = (char: string) => /^[A-Z]$/.test(char);
const isDigit = (char: string) => /^\d$/.test(char);

/** "COLOMBIA" → moto; cualquier otro texto (municipio) → carro; vacío → sin pista. */
function regionHint(region: string): VehicleType | null {
  const text = region.trim().toUpperCase();
  if (text === '') return null;
  return text === 'COLOMBIA' ? 'MOTORCYCLE' : 'CAR';
}

export function interpretPlate(rawText: string, region: string): PlateInterpretation {
  const text = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (text.length !== 5 && text.length !== 6) return { kind: 'UNRECOGNIZED' };

  const letters = text.slice(0, 3).split('').map(asLetter).join('');
  const digits = text.slice(3, 5).split('').map(asDigit).join('');
  if (![...letters].every(isLetter) || ![...digits].every(isDigit)) return { kind: 'UNRECOGNIZED' };

  // AAA12: moto con placa antigua.
  if (text.length === 5) {
    return { kind: 'RECOGNIZED', plate: letters + digits, vehicleType: 'MOTORCYCLE' };
  }

  const last = text[5]!;
  const hint = regionHint(region);
  const ambiguous = last in LETTER_FOR_DIGIT || last in DIGIT_FOR_LETTER;

  let vehicleType: VehicleType;
  if (ambiguous && hint) {
    vehicleType = hint;
  } else if (isDigit(last)) {
    vehicleType = 'CAR';
  } else if (isLetter(last)) {
    vehicleType = 'MOTORCYCLE';
  } else {
    return { kind: 'UNRECOGNIZED' };
  }

  const lastChar = vehicleType === 'CAR' ? asDigit(last) : asLetter(last);
  const plate = letters + digits + lastChar;

  // El formato dice una cosa y la región otra: no se adivina, decide el empleado.
  if (hint && hint !== vehicleType) return { kind: 'CONFLICT', plate };

  return { kind: 'RECOGNIZED', plate, vehicleType };
}
