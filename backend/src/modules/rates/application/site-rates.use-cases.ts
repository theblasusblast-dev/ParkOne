import { AppError } from '../../../shared/app-error';
import type { Clock } from '../../../shared/domain/clock';
import { toMinutes } from '../../../shared/domain/clock-time';
import { assertSiteAccess } from '../../auth/domain/site-access';
import type { PublicProfile } from '../../auth/domain/user-account';
import { respectsNightDiscount, type Rate, type RatePair } from '../domain/rate';
import type { RateRepository, RateVersion, SiteBands } from './ports';

export interface SiteRatesView extends SiteBands {
  siteId: string;
  rates: Rate[];
}

const VEHICLE_NAME: Record<RatePair['vehicleType'], string> = { CAR: 'carro', MOTORCYCLE: 'moto' };

const siteNotFound = () => new AppError(404, 'SITE_NOT_FOUND', 'No existe una sede con ese id.');

/** Tarifas vigentes y franjas de una sede. El empleado solo ve las de su sede. */
export class GetSiteRatesUseCase {
  constructor(private readonly rates: RateRepository) {}

  async execute(user: PublicProfile, siteId: string): Promise<SiteRatesView> {
    assertSiteAccess(user, siteId);
    const bands = await this.rates.findBands(siteId);
    if (!bands) throw siteNotFound();
    return { siteId, ...bands, rates: await this.rates.currentRates(siteId) };
  }
}

/** Todas las versiones de tarifa de una sede, de la más reciente a la más antigua. */
export class GetRateHistoryUseCase {
  constructor(private readonly rates: RateRepository) {}

  async execute(siteId: string): Promise<Rate[]> {
    if (!(await this.rates.findBands(siteId))) throw siteNotFound();
    return this.rates.history(siteId);
  }
}

/**
 * Actualiza tarifas (solo administrador). Valida RN-02 y crea una versión
 * nueva solo de los valores que cambiaron (RN-07); los cobros ya generados
 * conservan el valor con que se calcularon.
 */
export class UpdateSiteRatesUseCase {
  constructor(
    private readonly rates: RateRepository,
    private readonly clock: Clock,
  ) {}

  async execute(user: PublicProfile, siteId: string, pairs: readonly RatePair[]): Promise<SiteRatesView> {
    const broken = pairs.find((pair) => !respectsNightDiscount(pair));
    if (broken) {
      throw new AppError(
        400,
        'RATE_RULE_VIOLATION',
        `La tarifa nocturna de ${VEHICLE_NAME[broken.vehicleType]} debe ser menor que la diurna (RN-02).`,
      );
    }

    if (!(await this.rates.findBands(siteId))) throw siteNotFound();

    const current = await this.rates.currentRates(siteId);
    const changed: RateVersion[] = pairs
      .flatMap((pair): RateVersion[] => [
        { vehicleType: pair.vehicleType, band: 'DAY', amountCop: pair.dayAmountCop },
        { vehicleType: pair.vehicleType, band: 'NIGHT', amountCop: pair.nightAmountCop },
      ])
      .filter((version) => {
        const existing = current.find((rate) => rate.vehicleType === version.vehicleType && rate.band === version.band);
        return existing?.amountCop !== version.amountCop;
      });

    if (changed.length > 0) {
      await this.rates.replace(siteId, changed, this.clock.now());
    }

    return new GetSiteRatesUseCase(this.rates).execute(user, siteId);
  }
}

/** Cambia las horas de inicio de las franjas (solo administrador). */
export class UpdateSiteBandsUseCase {
  constructor(private readonly rates: RateRepository) {}

  async execute(siteId: string, bands: SiteBands): Promise<SiteBands> {
    // La franja diurna empieza el día operativo (S-02), así que debe ir primero.
    if (toMinutes(bands.dayBandStart) >= toMinutes(bands.nightBandStart)) {
      throw new AppError(400, 'BAND_ORDER_INVALID', 'La franja diurna debe empezar antes que la nocturna.');
    }
    if (!(await this.rates.findBands(siteId))) throw siteNotFound();
    return this.rates.updateBands(siteId, bands);
  }
}
