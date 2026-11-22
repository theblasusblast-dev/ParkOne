/** Franjas horarias de cobro. Coinciden con el enum Band de la base de datos. */
export const BANDS = ['DAY', 'NIGHT'] as const;

export type Band = (typeof BANDS)[number];
