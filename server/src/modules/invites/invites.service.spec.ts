import { beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import type { TripAccess } from '../../shared/tripItems/tripItem.types';
import type { GuestRole, TripRecord, TripRole } from '../trips/trips.types';
import { InvitesService } from './invites.service';
import type { IInvitesRepository, InviteRecord, InviteShape } from './invites.types';

const TRIP = 10;
const USERS: Record<number, { name: string | null; email: string }> = {
  1: { name: 'Dana', email: 'dana@x.com' },
  2: { name: 'Editor', email: 'editor@x.com' },
  4: { name: 'Friend', email: 'friend@x.com' },
};

let members: { userId: number; role: TripRole }[];
let invite: (InviteShape & { tripId: number }) | null;

const repo: IInvitesRepository = {
  async findByTrip(tripId) {
    return invite && invite.tripId === tripId ? { token: invite.token, role: invite.role } : null;
  },
  async findByToken(token): Promise<InviteRecord | null> {
    if (!invite || invite.token !== token) return null;
    return {
      ...invite,
      trip: {
        title: 'Amsterdam',
        destination: 'Netherlands',
        members: members.map((m) => ({ ...m, user: USERS[m.userId]! })),
      },
    };
  },
  async save(tripId, role, token) {
    invite = invite ? { ...invite, role } : { tripId, role, token };
    return { token: invite.token, role: invite.role };
  },
  async delete() {
    invite = null;
  },
  async addMember(_tripId, userId, role: GuestRole) {
    members.push({ userId, role });
  },
};

const access: TripAccess = {
  async requireRole(userId, tripId, allowed) {
    const member = members.find((m) => m.userId === userId);
    if (tripId !== TRIP || !member) throw new AppError('Trip not found', 404);
    if (!allowed.includes(member.role)) throw new AppError('Forbidden', 403);
    return { id: tripId } as TripRecord;
  },
};

let made: number;
let service: InvitesService;

beforeEach(() => {
  members = [
    { userId: 1, role: 'OWNER' },
    { userId: 2, role: 'EDITOR' },
  ];
  invite = null;
  made = 0;
  service = new InvitesService(repo, access, () => `token-${++made}`);
});

describe('InvitesService', () => {
  it('has no link until the owner creates one', async () => {
    expect(await service.get(1, TRIP)).toBeNull();
    expect(await service.save(1, TRIP, 'VIEWER')).toEqual({ token: 'token-1', role: 'VIEWER' });
    expect(await service.get(1, TRIP)).toEqual({ token: 'token-1', role: 'VIEWER' });
  });

  it('keeps the link when its role changes', async () => {
    await service.save(1, TRIP, 'VIEWER');
    expect(await service.save(1, TRIP, 'EDITOR')).toEqual({ token: 'token-1', role: 'EDITOR' });
  });

  it('kills a link that was turned off: the next one is new', async () => {
    await service.save(1, TRIP, 'VIEWER');
    await service.remove(1, TRIP);
    await expect(service.preview(4, 'token-1')).rejects.toMatchObject({ statusCode: 404 });
    await expect(service.accept(4, 'token-1')).rejects.toMatchObject({ statusCode: 404 });
    const again = await service.save(1, TRIP, 'VIEWER');
    expect(again.token).not.toBe('token-1');
  });

  it('is the owner\'s alone to see and manage', async () => {
    await service.save(1, TRIP, 'VIEWER');
    await expect(service.get(2, TRIP)).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.save(2, TRIP, 'EDITOR')).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.remove(2, TRIP)).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.get(4, TRIP)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('shows whoever holds the link what they are joining', async () => {
    await service.save(1, TRIP, 'VIEWER');
    expect(await service.preview(4, 'token-1')).toEqual({
      tripId: TRIP,
      title: 'Amsterdam',
      destination: 'Netherlands',
      role: 'VIEWER',
      invitedBy: 'Dana',
      alreadyMember: false,
    });
    expect((await service.preview(2, 'token-1')).alreadyMember).toBe(true);
  });

  it('adds whoever accepts with the link\'s role', async () => {
    await service.save(1, TRIP, 'VIEWER');
    expect(await service.accept(4, 'token-1')).toEqual({ tripId: TRIP });
    expect(members).toContainEqual({ userId: 4, role: 'VIEWER' });
  });

  it('leaves people already on the trip as they are', async () => {
    await service.save(1, TRIP, 'VIEWER');
    await service.accept(2, 'token-1');
    await service.accept(1, 'token-1');
    expect(members).toEqual([
      { userId: 1, role: 'OWNER' },
      { userId: 2, role: 'EDITOR' },
    ]);
  });
});
