/**
 * Secciones (tags) en que Swagger agrupa los endpoints.
 * Cada módulo agrega su tag aquí cuando tiene endpoints reales.
 */
export const TAGS = {
  system: {
    name: 'Sistema',
    description: 'Estado y disponibilidad del servicio.',
  },
  auth: {
    name: 'Autenticación',
    description: 'Inicio de sesión y usuario de la sesión actual.',
  },
  sites: {
    name: 'Sedes',
    description: 'Sedes del parqueadero, su mapa de espacios y su capacidad.',
  },
  employees: {
    name: 'Empleados',
    description: 'Empleados de cada sede: alta, cambio de sede y activación.',
  },
  rates: {
    name: 'Tarifas y franjas',
    description: 'Tarifas versionadas por tipo de vehículo y franja, y horarios de cada franja.',
  },
  access: {
    name: 'Carril',
    description: 'Lectura de placas, ingresos, salidas y barrera.',
  },
  billing: {
    name: 'Cobros y pagos',
    description: 'Cobros del día operativo y pagos en efectivo desde la caja.',
  },
} as const;

export const TAG_LIST = Object.values(TAGS);
