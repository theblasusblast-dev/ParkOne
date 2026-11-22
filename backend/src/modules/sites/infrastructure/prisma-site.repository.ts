import type { PrismaClient, Site } from '@prisma/client';
import type { NewSiteData, SiteRepository } from '../application/ports';
import { summarizeCapacity, type SiteSummary, type SpotTally } from '../domain/site';

/** Adaptador de persistencia de sedes con Prisma. */
export class PrismaSiteRepository implements SiteRepository {
  constructor(private readonly db: PrismaClient) {}

  async existsByName(name: string): Promise<boolean> {
    // Sin distinguir mayúsculas: "parkone norte" y "ParkOne Norte" son la misma sede.
    const found = await this.db.site.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    return found !== null;
  }

  async create(data: NewSiteData): Promise<SiteSummary> {
    // Un create con datos anidados es una sola transacción: o se crean la
    // sede, sus espacios y sus tarifas, o no se crea nada.
    const site = await this.db.site.create({
      data: {
        name: data.name,
        department: data.department,
        city: data.city,
        spots: { createMany: { data: data.spots.map((spot) => ({ ...spot })) } },
        rates: { createMany: { data: data.rates.map((rate) => ({ ...rate })) } },
      },
    });

    // Todos los espacios nacen libres, así que la capacidad se conoce sin consultar.
    const tallies: SpotTally[] = data.spots.map((spot) => ({
      vehicleType: spot.vehicleType,
      status: 'FREE',
      count: 1,
    }));
    return toSummary(site, tallies);
  }

  async list(): Promise<SiteSummary[]> {
    const [sites, tallies] = await Promise.all([
      this.db.site.findMany({ orderBy: { createdAt: 'asc' } }),
      this.countSpots(),
    ]);
    return sites.map((site) => toSummary(site, tallies.get(site.id) ?? []));
  }

  async findById(id: string): Promise<SiteSummary | null> {
    const site = await this.db.site.findUnique({ where: { id } });
    if (!site) return null;
    const tallies = await this.countSpots(id);
    return toSummary(site, tallies.get(id) ?? []);
  }

  /** Cuenta los espacios por sede, tipo y estado con un solo GROUP BY. */
  private async countSpots(siteId?: string): Promise<Map<string, SpotTally[]>> {
    const groups = await this.db.parkingSpot.groupBy({
      by: ['siteId', 'vehicleType', 'status'],
      where: siteId ? { siteId } : {},
      _count: { _all: true },
    });

    const bySite = new Map<string, SpotTally[]>();
    for (const group of groups) {
      const list = bySite.get(group.siteId) ?? [];
      list.push({ vehicleType: group.vehicleType, status: group.status, count: group._count._all });
      bySite.set(group.siteId, list);
    }
    return bySite;
  }
}

function toSummary(site: Site, tallies: readonly SpotTally[]): SiteSummary {
  return {
    id: site.id,
    name: site.name,
    department: site.department,
    city: site.city,
    dayBandStart: site.dayBandStart,
    nightBandStart: site.nightBandStart,
    active: site.active,
    capacity: summarizeCapacity(tallies),
  };
}
