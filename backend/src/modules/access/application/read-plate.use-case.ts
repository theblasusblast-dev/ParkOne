import type { VehicleType } from '../../../shared/domain/vehicle-type';
import { interpretPlate } from '../domain/plate';

export const MAX_READ_ATTEMPTS = 3;

export interface PlateReadingInput {
  text: string;
  region: string;
  /** Confianza que reporta la cámara, de 0 a 1. */
  confidence: number;
  /** Número de intento: 1, 2 o 3. */
  attempt: number;
}

export interface PlateReadingDecision {
  outcome: 'ACCEPTED' | 'RETRY' | 'MANUAL_REVIEW';
  plate: string | null;
  vehicleType: VehicleType | null;
  attempt: number;
  maxAttempts: number;
  /** Texto para la pantalla junto a la barrera. */
  message: string;
}

/**
 * Decide qué hacer con una lectura de la cámara: aceptarla, reintentar
 * (hasta 3 veces) o llamar al empleado para que la valide (F-06).
 */
export class ReadPlateUseCase {
  constructor(private readonly confidenceThreshold: number) {}

  execute(input: PlateReadingInput): PlateReadingDecision {
    const base = { attempt: input.attempt, maxAttempts: MAX_READ_ATTEMPTS };

    if (input.confidence < this.confidenceThreshold) {
      if (input.attempt < MAX_READ_ATTEMPTS) {
        return {
          ...base,
          outcome: 'RETRY',
          plate: null,
          vehicleType: null,
          message: `Reconociendo… intento ${input.attempt + 1} de ${MAX_READ_ATTEMPTS}`,
        };
      }
      return manualReview(base, null, 'No se pudo leer la placa con suficiente confianza.');
    }

    const result = interpretPlate(input.text, input.region);
    if (result.kind === 'UNRECOGNIZED') {
      return manualReview(base, null, 'El formato de la placa no es colombiano o no se reconoce.');
    }
    if (result.kind === 'CONFLICT') {
      return manualReview(base, result.plate, 'La región de la placa no coincide con su formato.');
    }

    const label = result.vehicleType === 'CAR' ? 'carro' : 'moto';
    return {
      ...base,
      outcome: 'ACCEPTED',
      plate: result.plate,
      vehicleType: result.vehicleType,
      message: `Placa ${result.plate} reconocida (${label}).`,
    };
  }
}

function manualReview(
  base: { attempt: number; maxAttempts: number },
  plate: string | null,
  reason: string,
): PlateReadingDecision {
  return { ...base, outcome: 'MANUAL_REVIEW', plate, vehicleType: null, message: `Llamando al empleado: ${reason}` };
}
