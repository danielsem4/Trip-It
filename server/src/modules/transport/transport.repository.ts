import type { Transport } from '@prisma/client';
import prisma from '../../lib/prisma';
import { num } from '../../shared/utils/price';
import type { ITripItemRepository } from '../../shared/tripItems/tripItem.types';
import type { TransportData, TransportRecord } from './transport.types';

const toRecord = ({
  createdAt: _c,
  updatedAt: _u,
  priceAmount,
  ...rest
}: Transport): TransportRecord => ({ ...rest, priceAmount: num(priceAmount) });

export class TransportRepository implements ITripItemRepository<TransportRecord, TransportData> {
  async list(tripId: number): Promise<TransportRecord[]> {
    const rows = await prisma.transport.findMany({
      where: { tripId },
      orderBy: [{ date: 'asc' }, { time: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toRecord);
  }

  async find(tripId: number, id: number): Promise<TransportRecord | null> {
    const row = await prisma.transport.findFirst({ where: { id, tripId } });
    return row && toRecord(row);
  }

  async create(tripId: number, data: TransportData): Promise<TransportRecord> {
    return toRecord(await prisma.transport.create({ data: { ...data, tripId } }));
  }

  async update(id: number, data: TransportData): Promise<TransportRecord> {
    return toRecord(await prisma.transport.update({ where: { id }, data }));
  }

  async delete(id: number): Promise<void> {
    await prisma.transport.delete({ where: { id } });
  }
}
