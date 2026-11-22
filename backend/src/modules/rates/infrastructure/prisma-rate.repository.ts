import type { PrismaClient } from '@prisma/client';
import type { RateRepository, RateVersion, SiteBands } from '../application/ports';
import type { Rate } from '../domain/rate';

const RATE_FIELDS = {
  id: true,
  vehicleType: true,
  band: true,
  amountCop: true,
  validFrom: true,
  validTo: true,
} as const;

/** Adaptador de persistencia de tarifas y franjas con Prisma. */
export class PrismaRateRepository implements RateRepository {
  constructor(private readonly db: PrismaClient) {}

  findBands(siteId: string): Promise<SiteBands | null> {
    return this.db.site.findUnique({
      where: { id: siteId },
      select: { dayBandStart: true, nightBandStart: true },
    });
  }

  currentRates(siteId: string): Promise<Rate[]> {
    return this.db.rate.findMany({
      where: { siteId, validTo: null },
      orderBy: [{ vehicleType: 'asc' }, { band: 'asc' }],
      select: RATE_FIELDS,
    });
  }

  history(siteId: string): Promise<Rate[]> {
    return this.db.rate.findMany({
      where: { siteId },
      orderBy: [{ validFrom: 'desc' }, { vehicleType: 'asc' }, { band: 'asc' }],
      select: RATE_FIELDS,
    });
  }

  async replace(siteId: string, versions: readonly RateVersion[], at: Date): Promise<void> {
    await this.db.$transaction(async (tx) => {
      for (const version of versions) {
        await tx.rate.updateMany({
          where: { siteId, vehicleType: version.vehicleType, band: version.band, validTo: null },
          data: { validTo: at },
        });
        await tx.rate.create({ data: { siteId, ...version, validFrom: at } });
      }
    });
  }

  updateBands(siteId: string, bands: SiteBands): Promise<SiteBands> {
    return this.db.site.update({
      where: { id: siteId },
      data: bands,
      select: { dayBandStart: true, nightBandStart: true },
    });
  }
}
