import { AppError } from '../../../shared/app-error';
import type { Band } from '../../../shared/domain/band';
import type { SpotStatus } from '../../../shared/domain/spot-status';
import type { VehicleType } from '../../../shared/domain/vehicle-type';
import type { ChargeStatus } from '../../billing/domain/charge';

/** Un cuadro del mapa: gris libre, verde ocupado, rojo inhabilitado. */
export interface SpotView {
  id: string;
  code: string;
  vehicleType: VehicleType;
  status: SpotStatus;
  disabledReason: string | null;
  occupant: {
    plate: string;
    since: Date;
    minutesParked: number;
    charge: { amountCop: number; band: Band; status: ChargeStatus } | null;
  } | null;
}

/**
 * Reglas para cambiar el estado de un espacio a mano:
 *   - Solo se inhabilita un espacio libre, y con motivo.
 *   - Solo se habilita un espacio inhabilitado.
 * Ocupar y liberar lo hacen el ingreso y la salida, no el empleado.
 */
export function assertManualChange(current: SpotStatus, target: 'FREE' | 'DISABLED', reason: string | null): void {
  if (target === 'DISABLED') {
    if (current === 'OCCUPIED') throw new AppError(409, 'SPOT_OCCUPIED', 'No se puede inhabilitar un espacio ocupado.');
    if (current === 'DISABLED') throw new AppError(409, 'SPOT_ALREADY_DISABLED', 'El espacio ya está inhabilitado.');
    if (!reason) throw new AppError(400, 'REASON_REQUIRED', 'Indica el motivo para inhabilitar el espacio.');
  } else if (current !== 'DISABLED') {
    throw new AppError(409, 'SPOT_NOT_DISABLED', 'Solo se puede habilitar un espacio inhabilitado.');
  }
}
