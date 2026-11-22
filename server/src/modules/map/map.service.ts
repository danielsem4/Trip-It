import { CAN_VIEW, type TripAccess } from '../../shared/tripItems/tripItem.types';
import { coordsFromMapUrl } from './map.url';
import { normalizeQuery, placeQueries, transportQueries } from './map.queries';
import type {
  Bbox,
  Coords,
  GeoHit,
  Geocoder,
  IGeocodeStore,
  IMapRepository,
  MapPoint,
  MapShape,
} from './map.types';

// A text that wasn't found is tried again after a while: the map data it's checked against grows.
const RETRY_NOT_FOUND_MS = 7 * 24 * 60 * 60 * 1000;

interface Target {
  point: Omit<MapPoint, 'lat' | 'lng'>;
  known: Coords | null;
  queries: string[];
}

export class MapService {
  constructor(
    private readonly repo: IMapRepository,
    private readonly store: IGeocodeStore,
    private readonly geocoder: Geocoder,
    private readonly access: TripAccess,
    private readonly now: () => number = Date.now,
  ) {}

  async get(userId: number, tripId: number): Promise<MapShape> {
    const trip = await this.access.requireRole(userId, tripId, CAN_VIEW);
    const items = await this.repo.listItems(tripId);

    const located = (kind: 'stay' | 'place') => (item: (typeof items.stays)[number]): Target => ({
      point: { kind, itemId: item.id },
      known: coordsFromMapUrl(item.mapUrl),
      queries: placeQueries(item, trip.destination),
    });
    const targets: Target[] = [
      ...items.stays.map(located('stay')),
      ...items.places.map(located('place')),
      ...items.transport.flatMap((ride) =>
        (['from', 'to'] as const).map((end) => ({
          point: { kind: 'transport' as const, itemId: ride.id, end },
          known: null,
          queries: transportQueries(end === 'from' ? ride.fromPlace : ride.toPlace, trip.destination),
        })),
      ),
    ];

    const areaQuery = normalizeQuery(trip.destination);
    const wanted = new Set([areaQuery, ...targets.filter((t) => !t.known).flatMap((t) => t.queries)]);
    const rows = await this.store.find([...wanted]);
    // Only what can be relied on: hits, and misses recent enough not to retry.
    const cache = new Map<string, GeoHit | null>();
    for (const row of rows) {
      if (row.hit || this.now() - row.checkedAt.getTime() < RETRY_NOT_FOUND_MS) cache.set(row.query, row.hit);
    }

    let pending = 0;
    const area = cache.get(areaQuery) ?? null;
    const near: Bbox | null = area?.bbox ?? null;
    const ask = (query: string, bias: Bbox | null) => {
      if (this.geocoder.enqueue(query, bias)) pending++;
    };
    // The destination goes first: its area steers every other lookup towards the trip.
    const areaKnown = !areaQuery || cache.has(areaQuery);
    if (!areaKnown) ask(areaQuery, null);

    const points: MapPoint[] = [];
    for (const { point, known, queries } of targets) {
      if (known) {
        points.push({ ...point, ...known });
        continue;
      }
      for (const query of queries) {
        if (!cache.has(query)) {
          // The next candidate is only worth a request if this one comes back empty.
          if (areaKnown) ask(query, near);
          break;
        }
        const hit = cache.get(query);
        if (hit) {
          points.push({ ...point, lat: hit.lat, lng: hit.lng });
          break;
        }
      }
    }

    return { area, points, pending };
  }
}
