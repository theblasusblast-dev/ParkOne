import { AppError } from '../../../shared/app-error';
import type { Clock } from '../../../shared/domain/clock';
import type { EventPublisher } from '../../../shared/domain/events';
import { assertSiteAccess } from '../../auth/domain/site-access';
import type { PublicProfile } from '../../auth/domain/user-account';
import { assertManualChange, type SpotView } from '../domain/spot';
import type { SpotFilter, SpotRepository } from './ports';

/** Mapa de espacios de una sede, con filtros. El empleado solo ve su sede. */
export class GetSpotMapUseCase {
  constructor(
    private readonly spots: SpotRepository,
    private readonly clock: Clock,
  ) {}

  async execute(user: PublicProfile, siteId: string, filter: SpotFilter): Promise<SpotView[]> {
    assertSiteAccess(user, siteId);
    if (!(await this.spots.siteExists(siteId))) {
      throw new AppError(404, 'SITE_NOT_FOUND', 'No existe una sede con ese id.');
    }

    const now = this.clock.now().getTime();
    const map = await this.spots.listMap(siteId, filter);
    return map.map((spot) =>
      spot.occupant
        ? { ...spot, occupant: { ...spot.occupant, minutesParked: Math.floor((now - spot.occupant.since.getTime()) / 60000) } }
        : spot,
    );
  }
}

/** Habilita o inhabilita un espacio, con motivo obligatorio al inhabilitar. */
export class ChangeSpotStatusUseCase {
  constructor(
    private readonly spots: SpotRepository,
    private readonly events: EventPublisher,
  ) {}

  async execute(user: PublicProfile, spotId: string, target: 'FREE' | 'DISABLED', reason: string | null): Promise<void> {
    const spot = await this.spots.findSpot(spotId);
    if (!spot) throw new AppError(404, 'SPOT_NOT_FOUND', 'No existe un espacio con ese id.');
    assertSiteAccess(user, spot.siteId);

    assertManualChange(spot.status, target, reason);
    await this.spots.setStatus(spotId, target, target === 'DISABLED' ? reason : null);
    this.events.publish({ type: 'SPOTS_CHANGED', siteId: spot.siteId });
  }
}
