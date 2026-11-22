import type { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma';
import { num } from '../../shared/utils/price';
import type { ITripsRepository, TripRecord, TripWriteData } from './trips.types';

const include = {
  members: {
    include: { user: { select: { name: true, email: true } } },
    orderBy: { joinedAt: 'asc' as const },
  },
};

type TripRow = Prisma.TripGetPayload<{ include: typeof include }>;

const toRecord = ({ budgetAmount, ...row }: TripRow): TripRecord => ({
  ...row,
  budgetAmount: num(budgetAmount),
});

export class TripsRepository implements ITripsRepository {
  async listForUser(userId: number): Promise<TripRecord[]> {
    const rows = await prisma.trip.findMany({
      where: { members: { some: { userId } } },
      include,
    });
    return rows.map(toRecord);
  }

  async findById(tripId: number): Promise<TripRecord | null> {
    const row = await prisma.trip.findUnique({ where: { id: tripId }, include });
    return row && toRecord(row);
  }

  async createWithOwner(userId: number, data: TripWriteData): Promise<TripRecord> {
    const row = await prisma.trip.create({
      data: {
        ...data,
        members: { create: { userId, role: 'OWNER' } },
        // Every trip starts with its two built-in place sections.
        sections: { create: [{ kind: 'ATTRACTIONS' }, { kind: 'RESTAURANTS' }] },
      },
      include,
    });
    return toRecord(row);
  }

  async update(tripId: number, data: Partial<TripWriteData>): Promise<TripRecord> {
    return toRecord(await prisma.trip.update({ where: { id: tripId }, data, include }));
  }

  async delete(tripId: number): Promise<void> {
    await prisma.trip.delete({ where: { id: tripId } });
  }
}
