import { AppError } from '../../../shared/app-error';
import { DEFAULT_RATES } from '../../rates/domain/default-rates';
import type { SiteSummary } from '../domain/site';
import { buildSpotLayout } from '../domain/spot-layout';
import type { SiteRepository } from './ports';

export interface CreateSiteInput {
  name: string;
  department: string;
  city: string;
  carSpots: number;
  motorcycleSpots: number;
}

/**
 * Crea una sede con su mapa de espacios (C-01…, M-01…) y sus tarifas
 * iniciales. Las franjas toman los valores por defecto de la base de datos
 * (06:00 y 18:00).
 */
export class CreateSiteUseCase {
  constructor(private readonly sites: SiteRepository) {}

  async execute(input: CreateSiteInput): Promise<SiteSummary> {
    // Regla de negocio, no de formato: por eso vive aquí y no en el esquema Zod.
    if (input.carSpots + input.motorcycleSpots < 1) {
      throw new AppError(400, 'SITE_WITHOUT_SPOTS', 'La sede debe tener al menos un espacio de parqueo.');
    }

    if (await this.sites.existsByName(input.name)) {
      throw new AppError(409, 'SITE_NAME_TAKEN', `Ya existe una sede llamada "${input.name}".`);
    }

    return this.sites.create({
      name: input.name,
      department: input.department,
      city: input.city,
      spots: buildSpotLayout(input.carSpots, input.motorcycleSpots),
      rates: DEFAULT_RATES,
    });
  }
}
