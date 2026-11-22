import { beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import type { TripAccess } from '../../shared/tripItems/tripItem.types';
import type { TripRecord } from '../trips/trips.types';
import { MapService } from './map.service';
import type { Bbox, GeoHit, GeocodeRow, Geocoder, IGeocodeStore, IMapRepository, MapItems } from './map.types';

const NOW = Date.UTC(2026, 10, 22);
const DAY = 24 * 60 * 60 * 1000;
const BBOX: Bbox = [52.3, 52.4, 4.7, 5.0];
const AMSTERDAM: GeoHit = { lat: 52.37, lng: 4.89, bbox: BBOX };

const access: TripAccess = {
  async requireRole(userId, tripId) {
    if (userId !== 1) throw new AppError('Trip not found', 404);
    return { id: tripId, destination: 'Amsterdam' } as TripRecord;
  },
};

let items: MapItems;
let rows: GeocodeRow[];
let asked: { query: string; near: Bbox | null }[];
let accepting: boolean;

const repo: IMapRepository = { listItems: async () => items };
const store: IGeocodeStore = {
  find: async (queries) => rows.filter((r) => queries.includes(r.query)),
  save: async () => {},
};
const geocoder: Geocoder = {
  enqueue(query, near = null) {
    if (accepting) asked.push({ query, near });
    return accepting;
  },
};
const service = new MapService(repo, store, geocoder, access, () => NOW);

const cached = (query: string, hit: GeoHit | null, ageDays = 0): GeocodeRow => ({
  query,
  hit,
  checkedAt: new Date(NOW - ageDays * DAY),
});
const stay = (input: Partial<MapItems['stays'][number]>) => ({ id: 1, name: 'Hotel V', address: null, mapUrl: null, ...input });

beforeEach(() => {
  items = { stays: [], places: [], transport: [] };
  rows = [];
  asked = [];
  accepting = true;
});

describe('MapService.get', () => {
  it('hides the map from people outside the trip', async () => {
    await expect(service.get(2, 10)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('looks up the destination first and holds the rest until it is known', async () => {
    items.stays = [stay({ address: 'Weteringschans 136' })];
    const map = await service.get(1, 10);
    expect(map).toEqual({ area: null, points: [], pending: 1 });
    expect(asked).toEqual([{ query: 'amsterdam', near: null }]);
  });

  it('asks for missing items near the destination and returns the ones already found', async () => {
    rows = [cached('amsterdam', AMSTERDAM), cached('rijksmuseum, amsterdam', { lat: 52.36, lng: 4.885, bbox: null })];
    items.stays = [stay({ id: 7, address: 'Weteringschans 136' })];
    items.places = [{ id: 3, name: 'Rijksmuseum', address: null, mapUrl: null }];
    const map = await service.get(1, 10);
    expect(map.area).toEqual(AMSTERDAM);
    expect(map.points).toEqual([{ kind: 'place', itemId: 3, lat: 52.36, lng: 4.885 }]);
    expect(map.pending).toBe(1);
    expect(asked).toEqual([{ query: 'weteringschans 136', near: BBOX }]);
  });

  it('uses the coordinates in a map link without any lookup', async () => {
    rows = [cached('amsterdam', AMSTERDAM)];
    items.stays = [stay({ id: 7, address: 'somewhere vague', mapUrl: 'https://maps.google.com/?q=52.1,4.2' })];
    const map = await service.get(1, 10);
    expect(map.points).toEqual([{ kind: 'stay', itemId: 7, lat: 52.1, lng: 4.2 }]);
    expect(map.pending).toBe(0);
    expect(asked).toEqual([]);
  });

  it('moves on to the next candidate after a miss, and gives up when all miss', async () => {
    rows = [cached('amsterdam', AMSTERDAM), cached('weteringschans 136', null)];
    items.stays = [stay({ address: 'Weteringschans 136' })];
    expect((await service.get(1, 10)).pending).toBe(1);
    expect(asked).toEqual([{ query: 'weteringschans 136, amsterdam', near: BBOX }]);

    rows.push(cached('weteringschans 136, amsterdam', null));
    asked = [];
    expect(await service.get(1, 10)).toEqual({ area: AMSTERDAM, points: [], pending: 0 });
    expect(asked).toEqual([]);
  });

  it('retries a miss after a week', async () => {
    rows = [cached('amsterdam', AMSTERDAM), cached('rijksmuseum, amsterdam', null, 8)];
    items.places = [{ id: 3, name: 'Rijksmuseum', address: null, mapUrl: null }];
    await service.get(1, 10);
    expect(asked.map((a) => a.query)).toEqual(['rijksmuseum, amsterdam']);
  });

  it('gives a ride a dot at each end that has a place', async () => {
    rows = [cached('amsterdam', AMSTERDAM), cached('amsterdam centraal', { lat: 52.379, lng: 4.9, bbox: null })];
    items.transport = [{ id: 5, fromPlace: 'Amsterdam Centraal', toPlace: null }];
    const map = await service.get(1, 10);
    expect(map.points).toEqual([{ kind: 'transport', itemId: 5, end: 'from', lat: 52.379, lng: 4.9 }]);
    expect(map.pending).toBe(0);
  });

  it('reports nothing pending while the geocoder is refusing work', async () => {
    accepting = false;
    items.stays = [stay({ address: 'Weteringschans 136' })];
    expect((await service.get(1, 10)).pending).toBe(0);
  });
});
