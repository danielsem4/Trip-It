import { beforeEach, describe, expect, it } from 'vitest';
import { TripsService } from './trips.service';
import type { ITripsRepository, TripRecord, TripRole, TripWriteData } from './trips.types';

const USERS: Record<number, { name: string | null; email: string }> = {
  1: { name: 'Owner', email: 'owner@x.com' },
  2: { name: 'Editor', email: 'editor@x.com' },
  3: { name: null, email: 'viewer@x.com' },
  4: { name: 'Outsider', email: 'out@x.com' },
};

class FakeRepo implements ITripsRepository {
  trips: TripRecord[] = [];
  private nextId = 1;

  async listForUser(userId: number) {
    return this.trips.filter((t) => t.members.some((m) => m.userId === userId));
  }
  async findById(id: number) {
    return this.trips.find((t) => t.id === id) ?? null;
  }
  async createWithOwner(userId: number, data: TripWriteData) {
    const rec: TripRecord = {
      id: this.nextId++,
      title: data.title,
      destination: data.destination,
      startDate: data.startDate,
      endDate: data.endDate,
      coverColor: data.coverColor,
      coverImageUrl: data.coverImageUrl ?? null,
      members: [{ userId, role: 'OWNER', user: USERS[userId] }],
    };
    this.trips.push(rec);
    return rec;
  }
  async update(id: number, data: Partial<TripWriteData>) {
    const idx = this.trips.findIndex((t) => t.id === id);
    const rec = { ...this.trips[idx], ...data } as TripRecord;
    this.trips[idx] = rec;
    return rec;
  }
  async delete(id: number) {
    this.trips = this.trips.filter((t) => t.id !== id);
  }
  addMember(tripId: number, userId: number, role: TripRole) {
    this.trips.find((t) => t.id === tripId)!.members.push({ userId, role, user: USERS[userId] });
  }
}

const base = { title: 'Japan', destination: 'Tokyo', startDate: '2026-03-01', endDate: '2026-03-10' };

describe('TripsService', () => {
  let repo: FakeRepo;
  let service: TripsService;
  let tripId: number;

  beforeEach(async () => {
    repo = new FakeRepo();
    service = new TripsService(repo);
    tripId = (await service.create(1, base)).id;
    repo.addMember(tripId, 3, 'VIEWER');
    repo.addMember(tripId, 2, 'EDITOR');
  });

  it('create makes the creator OWNER and defaults coverColor to sky', async () => {
    const trip = await service.create(1, base);
    expect(trip.myRole).toBe('OWNER');
    expect(trip.coverColor).toBe('sky');
  });

  it('dates round-trip unchanged', async () => {
    const trip = await service.create(1, { ...base, startDate: '2026-03-01' });
    expect(trip.startDate).toBe('2026-03-01');
    expect(trip.endDate).toBe('2026-03-10');
  });

  it('list returns only trips the user belongs to, sorted by startDate', async () => {
    await service.create(1, { ...base, startDate: '2026-01-01', endDate: null });
    await service.create(4, base);
    const list = await service.list(1);
    expect(list.map((t) => t.startDate)).toEqual(['2026-01-01', '2026-03-01']);
  });

  it('get by outsider throws 404', async () => {
    await expect(service.get(4, tripId)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('get unknown id throws 404', async () => {
    await expect(service.get(1, 999)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('viewer update throws 403', async () => {
    await expect(service.update(3, tripId, { title: 'x' })).rejects.toMatchObject({ statusCode: 403 });
  });

  it('editor update succeeds', async () => {
    const trip = await service.update(2, tripId, { title: 'Renamed' });
    expect(trip.title).toBe('Renamed');
  });

  it('update that moves startDate after existing endDate throws 400', async () => {
    await expect(service.update(1, tripId, { startDate: '2026-04-01' })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('update with endDate: null clears it', async () => {
    const trip = await service.update(1, tripId, { endDate: null });
    expect(trip.endDate).toBeNull();
  });

  it('editor remove throws 403', async () => {
    await expect(service.remove(2, tripId)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('owner remove returns the coverImageUrl', async () => {
    await service.setCoverImage(1, tripId, '/uploads/a.png');
    const res = await service.remove(1, tripId);
    expect(res.coverImageUrl).toBe('/uploads/a.png');
    expect(await repo.findById(tripId)).toBeNull();
  });

  it('setCoverImage returns previousUrl', async () => {
    await service.setCoverImage(1, tripId, '/uploads/a.png');
    const res = await service.setCoverImage(2, tripId, '/uploads/b.png');
    expect(res.previousUrl).toBe('/uploads/a.png');
    expect(res.trip.coverImageUrl).toBe('/uploads/b.png');
  });

  it('members lists owner first with myRole per caller', async () => {
    const trip = await service.get(2, tripId);
    expect(trip.myRole).toBe('EDITOR');
    expect(trip.members.map((m) => m.role)).toEqual(['OWNER', 'EDITOR', 'VIEWER']);
  });
});
