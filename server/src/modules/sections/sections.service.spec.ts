import { beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import type { TripAccess } from '../../shared/tripItems/tripItem.types';
import type { TripRecord, TripRole } from '../trips/trips.types';
import type { PlacePhotos } from '../photos/photo.types';
import { placeSchema } from './sections.schema';
import { SectionsService } from './sections.service';
import type { ISectionsRepository, PlaceData, PlaceRecord, SectionRecord } from './sections.types';

class FakeRepo implements ISectionsRepository {
  sections: SectionRecord[] = [];
  private nextId = 1;

  seedTrip(tripId: number) {
    for (const kind of ['ATTRACTIONS', 'RESTAURANTS'] as const) {
      this.sections.push({ id: this.nextId++, tripId, kind, name: null, icon: null, places: [] });
    }
  }
  async list(tripId: number) {
    return this.sections.filter((s) => s.tripId === tripId);
  }
  async find(tripId: number, sectionId: number) {
    return this.sections.find((s) => s.tripId === tripId && s.id === sectionId) ?? null;
  }
  async createCustom(tripId: number, data: { name: string; icon: string }) {
    const section: SectionRecord = { id: this.nextId++, tripId, kind: 'CUSTOM', ...data, places: [] };
    this.sections.push(section);
    return section;
  }
  async update(sectionId: number, data: { name: string; icon: string }) {
    return Object.assign(this.sections.find((s) => s.id === sectionId)!, data);
  }
  async delete(sectionId: number) {
    this.sections = this.sections.filter((s) => s.id !== sectionId);
  }
  async createPlace(sectionId: number, data: PlaceData) {
    const place: PlaceRecord = { id: this.nextId++, sectionId, photoUrl: null, photoCheckedAt: null, ...data };
    this.sections.find((s) => s.id === sectionId)!.places.push(place);
    return place;
  }
  async updatePlace(placeId: number, data: Partial<PlaceRecord>) {
    const place = this.sections.flatMap((s) => s.places).find((p) => p.id === placeId)!;
    return Object.assign(place, data);
  }
  async deletePlace(placeId: number) {
    for (const s of this.sections) s.places = s.places.filter((p) => p.id !== placeId);
  }
}

const ROLES: Record<number, TripRole> = { 1: 'OWNER', 3: 'VIEWER' };
const access: TripAccess = {
  async requireRole(userId, tripId, allowed) {
    const role = ROLES[userId];
    if (!role) throw new AppError('Trip not found', 404);
    if (!allowed.includes(role)) throw new AppError('Forbidden', 403);
    return { id: tripId, currency: 'ILS', destination: 'Amsterdam' } as TripRecord;
  },
};

let discarded: (string | null)[];
const photos: PlacePhotos = {
  // Stands in for the real lookups: every place still unchecked counts as under way.
  refresh: (_destination, places) => places.filter((p) => !p.photoCheckedAt).length,
  async discard(photoUrl) {
    if (photoUrl) discarded.push(photoUrl);
  },
};

const place = (input: object) => placeSchema.parse({ name: 'Rijksmuseum', ...input });

describe('SectionsService', () => {
  let repo: FakeRepo;
  let service: SectionsService;
  let attractions: number;

  beforeEach(() => {
    repo = new FakeRepo();
    repo.seedTrip(1);
    repo.seedTrip(2);
    service = new SectionsService(repo, access, photos);
    discarded = [];
    attractions = repo.sections[0].id;
  });

  it('lists the trip\'s sections with their places', async () => {
    await service.createPlace(1, 1, attractions, place({ date: '2026-05-13' }));
    const { sections } = await service.list(3, 1);
    expect(sections.map((s) => s.kind)).toEqual(['ATTRACTIONS', 'RESTAURANTS']);
    expect(sections[0].places).toMatchObject([{ name: 'Rijksmuseum', date: '2026-05-13', done: false }]);
  });

  it('adds, renames and deletes a custom section', async () => {
    const created = await service.create(1, 1, { name: 'Coffee shops', icon: 'coffee' });
    expect(created).toMatchObject({ kind: 'CUSTOM', name: 'Coffee shops', icon: 'coffee', places: [] });
    const renamed = await service.update(1, 1, created.id, { name: 'Cafes', icon: 'cake' });
    expect(renamed.name).toBe('Cafes');
    await service.remove(1, 1, created.id);
    expect((await service.list(1, 1)).sections).toHaveLength(2);
  });

  it('refuses to rename or delete the built-in sections', async () => {
    await expect(service.update(1, 1, attractions, { name: 'x', icon: 'pin' })).rejects.toMatchObject({
      statusCode: 400,
    });
    await expect(service.remove(1, 1, attractions)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('defaults a price to the trip currency and drops a currency without an amount', async () => {
    const priced = await service.createPlace(1, 1, attractions, place({ priceAmount: 22.5 }));
    expect(priced).toMatchObject({ priceAmount: 22.5, priceCurrency: 'ILS' });
    const foreign = await service.createPlace(1, 1, attractions, place({ priceAmount: 5, priceCurrency: 'EUR' }));
    expect(foreign.priceCurrency).toBe('EUR');
    const free = await service.createPlace(1, 1, attractions, place({ priceCurrency: 'EUR' }));
    expect(free).toMatchObject({ priceAmount: null, priceCurrency: null });
  });

  it('marks a place done without touching its other fields', async () => {
    const created = await service.createPlace(1, 1, attractions, place({ notes: 'book ahead' }));
    const done = await service.setPlaceDone(1, 1, attractions, created.id, true);
    expect(done).toMatchObject({ done: true, notes: 'book ahead' });
  });

  it('reports photo lookups under way and keeps the bookkeeping to itself', async () => {
    const created = await service.createPlace(1, 1, attractions, place({}));
    expect(created).toMatchObject({ photoUrl: null });
    expect(created).not.toHaveProperty('photoCheckedAt');
    expect((await service.list(1, 1)).pendingPhotos).toBe(1);
    await repo.updatePlace(created.id, { photoUrl: '/api/uploads/places/1.webp', photoCheckedAt: new Date() });
    const list = await service.list(1, 1);
    expect(list.pendingPhotos).toBe(0);
    expect(list.sections[0].places[0].photoUrl).toBe('/api/uploads/places/1.webp');
  });

  it('keeps the photo through an edit unless the name or the website changes', async () => {
    const found = { photoUrl: '/api/uploads/places/1.webp', photoCheckedAt: new Date() };
    const created = await service.createPlace(1, 1, attractions, place({}));
    await repo.updatePlace(created.id, found);

    const noted = await service.updatePlace(1, 1, attractions, created.id, place({ notes: 'book ahead' }));
    expect(noted.photoUrl).toBe(found.photoUrl);
    expect(discarded).toEqual([]);

    const renamed = await service.updatePlace(1, 1, attractions, created.id, place({ name: 'Van Gogh Museum' }));
    expect(renamed.photoUrl).toBeNull();
    expect(discarded).toEqual([found.photoUrl]);
    expect((await service.list(1, 1)).pendingPhotos).toBe(1);
  });

  it('removes the photo file with its place or its section', async () => {
    const found = { photoUrl: '/api/uploads/places/1.webp', photoCheckedAt: new Date() };
    const created = await service.createPlace(1, 1, attractions, place({}));
    await repo.updatePlace(created.id, found);
    await service.removePlace(1, 1, attractions, created.id);

    const custom = await service.create(1, 1, { name: 'Cafes', icon: 'coffee' });
    const cafe = await service.createPlace(1, 1, custom.id, place({ name: 'Cafe' }));
    await repo.updatePlace(cafe.id, { photoUrl: '/api/uploads/places/2.webp', photoCheckedAt: new Date() });
    await service.remove(1, 1, custom.id);

    expect(discarded).toEqual(['/api/uploads/places/1.webp', '/api/uploads/places/2.webp']);
  });

  it('does not reach sections or places of another trip', async () => {
    const otherTripSection = repo.sections.find((s) => s.tripId === 2)!.id;
    await expect(service.createPlace(1, 1, otherTripSection, place({}))).rejects.toMatchObject({
      statusCode: 404,
    });
    const created = await service.createPlace(1, 2, otherTripSection, place({}));
    await expect(service.removePlace(1, 1, attractions, created.id)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('lets viewers read only', async () => {
    await expect(service.create(3, 1, { name: 'x', icon: 'pin' })).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.createPlace(3, 1, attractions, place({}))).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
