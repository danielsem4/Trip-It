import prisma from '../../lib/prisma';
import type { Bbox, GeoHit, GeocodeRow, IGeocodeStore, IMapRepository, MapItems } from './map.types';

const locatable = { id: true, name: true, address: true, mapUrl: true } as const;

export class MapRepository implements IMapRepository, IGeocodeStore {
  async listItems(tripId: number): Promise<MapItems> {
    const [stays, places, transport] = await Promise.all([
      prisma.stay.findMany({ where: { tripId }, select: locatable }),
      prisma.place.findMany({ where: { section: { tripId } }, select: locatable }),
      prisma.transport.findMany({ where: { tripId }, select: { id: true, fromPlace: true, toPlace: true } }),
    ]);
    return { stays, places, transport };
  }

  async find(queries: string[]): Promise<GeocodeRow[]> {
    if (queries.length === 0) return [];
    const rows = await prisma.geocodeCache.findMany({ where: { query: { in: queries } } });
    return rows.map(({ query, lat, lng, bbox, checkedAt }) => ({
      query,
      hit: lat !== null && lng !== null ? { lat, lng, bbox: bbox.length === 4 ? (bbox as Bbox) : null } : null,
      checkedAt,
    }));
  }

  async save(query: string, hit: GeoHit | null): Promise<void> {
    const data = { lat: hit?.lat ?? null, lng: hit?.lng ?? null, bbox: hit?.bbox ?? [], checkedAt: new Date() };
    await prisma.geocodeCache.upsert({ where: { query }, create: { query, ...data }, update: data });
  }
}
