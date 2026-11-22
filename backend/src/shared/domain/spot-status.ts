/**
 * Estados de un espacio de parqueo, con el color que usa el mapa:
 * FREE gris, OCCUPIED verde, DISABLED rojo.
 */
export const SPOT_STATUSES = ['FREE', 'OCCUPIED', 'DISABLED'] as const;

export type SpotStatus = (typeof SPOT_STATUSES)[number];
