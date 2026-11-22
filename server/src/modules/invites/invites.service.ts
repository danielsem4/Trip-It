import crypto from 'crypto';
import { AppError } from '../../shared/errors/AppError';
import type { TripAccess } from '../../shared/tripItems/tripItem.types';
import type { GuestRole } from '../trips/trips.types';
import type { IInvitesRepository, InvitePreview, InviteRecord, InviteShape } from './invites.types';

const newToken = () => crypto.randomBytes(32).toString('base64url');

export class InvitesService {
  constructor(
    private readonly repo: IInvitesRepository,
    private readonly access: TripAccess,
    private readonly makeToken: () => string = newToken,
  ) {}

  // The link itself is the owner's to see and manage.
  async get(userId: number, tripId: number): Promise<InviteShape | null> {
    await this.access.requireRole(userId, tripId, ['OWNER']);
    return this.repo.findByTrip(tripId);
  }

  async save(userId: number, tripId: number, role: GuestRole): Promise<InviteShape> {
    await this.access.requireRole(userId, tripId, ['OWNER']);
    return this.repo.save(tripId, role, this.makeToken());
  }

  // Turning the link off kills it for good: a new one gets a new address.
  async remove(userId: number, tripId: number): Promise<void> {
    await this.access.requireRole(userId, tripId, ['OWNER']);
    await this.repo.delete(tripId);
  }

  async preview(userId: number, token: string): Promise<InvitePreview> {
    const invite = await this.require(token);
    const { title, destination, members } = invite.trip;
    const owner = members.find((m) => m.role === 'OWNER');
    return {
      tripId: invite.tripId,
      title,
      destination,
      role: invite.role,
      invitedBy: owner?.user.name?.trim() || owner?.user.email || '',
      alreadyMember: members.some((m) => m.userId === userId),
    };
  }

  // Joins with the link's role. Someone already on the trip keeps the role they have.
  async accept(userId: number, token: string): Promise<{ tripId: number }> {
    const invite = await this.require(token);
    if (!invite.trip.members.some((m) => m.userId === userId)) {
      await this.repo.addMember(invite.tripId, userId, invite.role);
    }
    return { tripId: invite.tripId };
  }

  private async require(token: string): Promise<InviteRecord> {
    const invite = await this.repo.findByToken(token);
    if (!invite) throw new AppError('Invite not found', 404);
    return invite;
  }
}
