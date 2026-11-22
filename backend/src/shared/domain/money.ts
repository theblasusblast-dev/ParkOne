const COP = new Intl.NumberFormat('es-CO');

/** Formatea pesos colombianos: 8000 → "$8.000". */
export function formatCop(amount: number): string {
  return `$${COP.format(amount)}`;
}
