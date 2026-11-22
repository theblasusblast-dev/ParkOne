import { AppError } from '../../../shared/app-error';
import type { VehicleType } from '../../../shared/domain/vehicle-type';
import type { PublicProfile } from '../../auth/domain/user-account';
import { interpretPlate } from '../domain/plate';
import type { EntryResult, RegisterEntryUseCase } from './register-entry.use-case';

export interface ManualEntryInput {
  siteId: string;
  plate: string;
  vehicleType: VehicleType;
  foreignPlate: boolean;
}

/**
 * Ingreso con placa digitada o corregida por el empleado (F-06), incluida la
 * placa extranjera. Valida la placa y reutiliza el ingreso normal (HU-06), así
 * el cupo y el cobro siguen exactamente las mismas reglas. El evento queda
 * marcado como lectura manual y con el empleado que intervino.
 */
export class RegisterManualEntryUseCase {
  constructor(private readonly registerEntry: RegisterEntryUseCase) {}

  execute(user: PublicProfile, input: ManualEntryInput): Promise<EntryResult> {
    let plate = input.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!input.foreignPlate) {
      // El tipo que elige el empleado resuelve los caracteres ambiguos (1/I, 0/O…).
      const region = input.vehicleType === 'MOTORCYCLE' ? 'COLOMBIA' : 'MUNICIPIO';
      const result = interpretPlate(plate, region);
      if (result.kind !== 'RECOGNIZED' || result.vehicleType !== input.vehicleType) {
        const label = input.vehicleType === 'CAR' ? 'carro (AAA123)' : 'moto (AAA12A o AAA12)';
        throw new AppError(
          400,
          'INVALID_PLATE',
          `La placa ${plate} no tiene formato colombiano de ${label}. Si es extranjera, márquela como placa extranjera.`,
        );
      }
      plate = result.plate; // con las confusiones corregidas: A8C123 → ABC123
    } else if (plate.length < 3 || plate.length > 10) {
      throw new AppError(400, 'INVALID_PLATE', 'La placa extranjera debe tener entre 3 y 10 letras o números.');
    }

    return this.registerEntry.execute(user, {
      siteId: input.siteId,
      plate,
      vehicleType: input.vehicleType,
      confidence: null,
      region: null,
      manualRead: true,
      foreignPlate: input.foreignPlate,
    });
  }
}
