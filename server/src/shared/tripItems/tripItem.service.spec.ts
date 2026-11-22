import { beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../errors/AppError';
import type { TripRecord, TripRole } from '../../modules/trips/trips.types';
import { TripItemService } from './tripItem.service';
import type { ITripItemRepository, TripAccess, TripItemMapper } from './tripItem.types';

interface Note {
  id: number;
  tripId: number;
  text: string;
  currency: string;
}
type NoteData = Omit<Note, 'id' | 'tripId'>;

class FakeRepo implements ITripItemRepository<Note, NoteData> {
  notes: Note[] = [];
  private nextId = 1;

  async list(tripId: number) {
    return this.notes.filter((n) => n.tripId === tripId);
  }
  async find(tripId: number, id: number) {
    return this.notes.find((n) => n.tripId === tripId && n.id === id) ?? null;
  }
  async create(tripId: number, data: NoteData) {
    const note = { id: this.nextId++, tripId, ...data };
    this.notes.push(note);
    return note;
  }
  async update(id: number, data: NoteData) {
    const note = Object.assign(this.notes.find((n) => n.id === id)!, data);
    return note;
  }
  async delete(id: number) {
    this.notes = this.notes.filter((n) => n.id !== id);
  }
}

// Trips 1 and 2 exist; roles are per user and the same on both.
const ROLES: Record<number, TripRole> = { 1: 'OWNER', 2: 'EDITOR', 3: 'VIEWER' };
const access: TripAccess = {
  async requireRole(userId, tripId, allowed) {
    const role = ROLES[userId];
    if (tripId > 2 || !role) throw new AppError('Trip not found', 404);
    if (!allowed.includes(role)) throw new AppError('Forbidden', 403);
    return { id: tripId, currency: 'EUR' } as TripRecord;
  },
};

const mapper: TripItemMapper<Note, { text: string }, NoteData, { id: number; text: string }> = {
  notFound: 'Note not found',
  toData: (dto, trip) => ({ text: dto.text, currency: trip.currency }),
  toShape: ({ id, text }) => ({ id, text }),
};

describe('TripItemService', () => {
  let repo: FakeRepo;
  let service: TripItemService<Note, { text: string }, NoteData, { id: number; text: string }>;

  beforeEach(() => {
    repo = new FakeRepo();
    service = new TripItemService(repo, access, mapper);
  });

  it('creates through the mapper, with the trip available for defaults', async () => {
    const created = await service.create(2, 1, { text: 'hi' });
    expect(created).toEqual({ id: 1, text: 'hi' });
    expect(repo.notes[0]).toMatchObject({ tripId: 1, currency: 'EUR' });
  });

  it('lists only the trip\'s own items, for any member', async () => {
    await service.create(1, 1, { text: 'a' });
    await service.create(1, 2, { text: 'b' });
    expect(await service.list(3, 1)).toEqual([{ id: 1, text: 'a' }]);
  });

  it('hides everything from non-members with a 404', async () => {
    await expect(service.list(4, 1)).rejects.toMatchObject({ statusCode: 404 });
    await expect(service.create(4, 1, { text: 'x' })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('lets viewers read but not write', async () => {
    const { id } = await service.create(1, 1, { text: 'a' });
    await expect(service.create(3, 1, { text: 'x' })).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.update(3, 1, id, { text: 'x' })).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.remove(3, 1, id)).rejects.toMatchObject({ statusCode: 403 });
    expect(repo.notes).toHaveLength(1);
  });

  it('updates and removes an item', async () => {
    const { id } = await service.create(1, 1, { text: 'a' });
    expect(await service.update(2, 1, id, { text: 'b' })).toEqual({ id, text: 'b' });
    await service.remove(2, 1, id);
    expect(repo.notes).toEqual([]);
  });

  it('treats an item of another trip as not found', async () => {
    const { id } = await service.create(1, 2, { text: 'other trip' });
    await expect(service.update(1, 1, id, { text: 'x' })).rejects.toMatchObject({
      statusCode: 404,
      message: 'Note not found',
    });
    await expect(service.remove(1, 1, id)).rejects.toMatchObject({ statusCode: 404 });
    expect(repo.notes[0].text).toBe('other trip');
  });
});
