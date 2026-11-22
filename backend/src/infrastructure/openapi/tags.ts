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
} as const;

export const TAG_LIST = Object.values(TAGS);
