import prisma from '../../lib/prisma';
import type { ITripsRepository, TripRecord, TripWriteData } from './trips.types';

const include = {
  members: {
    include: { user: { select: { name: true, email: true } } },
    orderBy: { joinedAt: 'asc' as const },
  },
};

export class TripsRepository implements ITripsRepository {
  listForUser(userId: number): Promise<TripRecord[]> {
    return prisma.trip.findMany({
      where: { members: { some: { userId } } },
      include,
    }) as Promise<TripRecord[]>;
  }

  findById(tripId: number): Promise<TripRecord | null> {
    return prisma.trip.findUnique({ where: { id: tripId }, include }) as Promise<TripRecord | null>;
  }

  createWithOwner(userId: number, data: TripWriteData): Promise<TripRecord> {
    return prisma.trip.create({
      data: { ...data, members: { create: { userId, role: 'OWNER' } } },
      include,
    }) as Promise<TripRecord>;
  }

  update(tripId: number, data: Partial<TripWriteData>): Promise<TripRecord> {
    return prisma.trip.update({ where: { id: tripId }, data, include }) as Promise<TripRecord>;
  }

  async delete(tripId: number): Promise<void> {
    await prisma.trip.delete({ where: { id: tripId } });
  }
}
