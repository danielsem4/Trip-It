import prisma from '../../lib/prisma';
import type { GuestRole } from '../trips/trips.types';
import type { IInvitesRepository, InviteRecord, InviteShape } from './invites.types';

const select = { token: true, role: true } as const;

export class InvitesRepository implements IInvitesRepository {
  async findByTrip(tripId: number): Promise<InviteShape | null> {
    return (await prisma.tripInvite.findUnique({ where: { tripId }, select })) as InviteShape | null;
  }

  async findByToken(token: string): Promise<InviteRecord | null> {
    const row = await prisma.tripInvite.findUnique({
      where: { token },
      select: {
        ...select,
        tripId: true,
        trip: {
          select: {
            title: true,
            destination: true,
            members: { select: { userId: true, role: true, user: { select: { name: true, email: true } } } },
          },
        },
      },
    });
    return row as InviteRecord | null;
  }

  async save(tripId: number, role: GuestRole, token: string): Promise<InviteShape> {
    const row = await prisma.tripInvite.upsert({
      where: { tripId },
      create: { tripId, role, token },
      update: { role },
      select,
    });
    return row as InviteShape;
  }

  async delete(tripId: number): Promise<void> {
    await prisma.tripInvite.deleteMany({ where: { tripId } });
  }

  async addMember(tripId: number, userId: number, role: GuestRole): Promise<void> {
    await prisma.tripMember.upsert({
      where: { tripId_userId: { tripId, userId } },
      create: { tripId, userId, role },
      update: {},
    });
  }
}
