import type { Stay } from '@prisma/client';
import prisma from '../../lib/prisma';
import { num } from '../../shared/utils/price';
import type { ITripItemRepository } from '../../shared/tripItems/tripItem.types';
import type { StayData, StayRecord } from './stays.types';

const toRecord = ({ createdAt: _c, updatedAt: _u, priceAmount, ...rest }: Stay): StayRecord => ({
  ...rest,
  priceAmount: num(priceAmount),
});

export class StaysRepository implements ITripItemRepository<StayRecord, StayData> {
  async list(tripId: number): Promise<StayRecord[]> {
    const rows = await prisma.stay.findMany({
      where: { tripId },
      orderBy: [{ checkInDate: 'asc' }, { checkInTime: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toRecord);
  }

  async find(tripId: number, id: number): Promise<StayRecord | null> {
    const row = await prisma.stay.findFirst({ where: { id, tripId } });
    return row && toRecord(row);
  }

  async create(tripId: number, data: StayData): Promise<StayRecord> {
    return toRecord(await prisma.stay.create({ data: { ...data, tripId } }));
  }

  async update(id: number, data: StayData): Promise<StayRecord> {
    return toRecord(await prisma.stay.update({ where: { id }, data }));
  }

  async delete(id: number): Promise<void> {
    await prisma.stay.delete({ where: { id } });
  }
}
