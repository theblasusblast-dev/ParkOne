import type { PrismaClient } from '@prisma/client';
import type {
  ChargeFilter,
  ChargeRow,
  EventRow,
  HistoryFilter,
  HistoryRepository,
  Page,
  PaymentRow,
} from '../application/history';

/** Un día local de Bogotá (UTC-5) empieza a las 05:00 UTC. */
const localDayStart = (day: string) => new Date(`${day}T05:00:00.000Z`);
const localDayEnd = (day: string) => new Date(localDayStart(day).getTime() + 24 * 60 * 60 * 1000);
const toDbDate = (day: string) => new Date(`${day}T00:00:00.000Z`);

/** Rango de instantes [desde, hasta) a partir de días locales incluidos. */
function instantRange(filter: HistoryFilter) {
  if (!filter.from && !filter.to) return undefined;
  return {
    ...(filter.from ? { gte: localDayStart(filter.from) } : {}),
    ...(filter.to ? { lt: localDayEnd(filter.to) } : {}),
  };
}

const plateFilter = (plate?: string) => (plate ? { contains: plate, mode: 'insensitive' as const } : undefined);
const paging = (filter: HistoryFilter) => ({ skip: (filter.page - 1) * filter.pageSize, take: filter.pageSize });

/** Consultas de solo lectura del historial con Prisma, del más reciente al más antiguo. */
export class PrismaHistoryRepository implements HistoryRepository {
  constructor(private readonly db: PrismaClient) {}

  async siteExists(siteId: string): Promise<boolean> {
    return (await this.db.site.findUnique({ where: { id: siteId }, select: { id: true } })) !== null;
  }

  async events(filter: HistoryFilter): Promise<Page<EventRow>> {
    const where = { siteId: filter.siteId, plate: plateFilter(filter.plate), occurredAt: instantRange(filter) };
    const [rows, total] = await Promise.all([
      this.db.accessEvent.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        ...paging(filter),
        include: { spot: { select: { code: true } }, operator: { select: { fullName: true } } },
      }),
      this.db.accessEvent.count({ where }),
    ]);
    const items = rows.map((row) => ({
      id: row.id,
      occurredAt: row.occurredAt,
      direction: row.direction,
      plate: row.plate,
      vehicleType: row.vehicleType,
      barrierOpened: row.barrierOpened,
      decisionReason: row.decisionReason,
      manualRead: row.manualRead,
      foreignPlate: row.foreignPlate,
      confidence: row.confidence,
      spotCode: row.spot?.code ?? null,
      operatorName: row.operator?.fullName ?? null,
    }));
    return { items, page: filter.page, pageSize: filter.pageSize, total };
  }

  async charges(filter: ChargeFilter): Promise<Page<ChargeRow>> {
    const operatingDay =
      filter.from || filter.to
        ? { ...(filter.from ? { gte: toDbDate(filter.from) } : {}), ...(filter.to ? { lte: toDbDate(filter.to) } : {}) }
        : undefined;
    const where = {
      siteId: filter.siteId,
      plate: plateFilter(filter.plate),
      operatingDay,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.band ? { band: filter.band } : {}),
    };
    const [rows, total] = await Promise.all([
      this.db.charge.findMany({ where, orderBy: { createdAt: 'desc' }, ...paging(filter) }),
      this.db.charge.count({ where }),
    ]);
    const items = rows.map((row) => ({
      id: row.id,
      plate: row.plate,
      vehicleType: row.vehicleType,
      operatingDay: row.operatingDay.toISOString().slice(0, 10),
      band: row.band,
      amountCop: row.amountCop,
      status: row.status,
      createdAt: row.createdAt,
      paidAt: row.paidAt,
    }));
    return { items, page: filter.page, pageSize: filter.pageSize, total };
  }

  async payments(filter: HistoryFilter): Promise<Page<PaymentRow>> {
    const where = {
      paidAt: instantRange(filter),
      charge: { siteId: filter.siteId, plate: plateFilter(filter.plate) },
    };
    const [rows, total] = await Promise.all([
      this.db.payment.findMany({
        where,
        orderBy: { paidAt: 'desc' },
        ...paging(filter),
        include: { charge: { select: { plate: true, band: true } }, receivedBy: { select: { fullName: true } } },
      }),
      this.db.payment.count({ where }),
    ]);
    const items = rows.map((row) => ({
      id: row.id,
      paidAt: row.paidAt,
      amountCop: row.amountCop,
      reference: row.reference,
      plate: row.charge.plate,
      band: row.charge.band,
      receivedByName: row.receivedBy.fullName,
    }));
    return { items, page: filter.page, pageSize: filter.pageSize, total };
  }
}
