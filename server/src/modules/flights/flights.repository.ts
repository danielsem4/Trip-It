import type { Flight } from '@prisma/client';
import prisma from '../../lib/prisma';
import { num } from '../../shared/utils/price';
import type { ITripItemRepository } from '../../shared/tripItems/tripItem.types';
import type { FlightData, FlightRecord } from './flights.types';

const toRecord = ({ createdAt: _c, updatedAt: _u, priceAmount, ...rest }: Flight): FlightRecord => ({
  ...rest,
  priceAmount: num(priceAmount),
});

export class FlightsRepository implements ITripItemRepository<FlightRecord, FlightData> {
  async list(tripId: number): Promise<FlightRecord[]> {
    const rows = await prisma.flight.findMany({
      where: { tripId },
      orderBy: [{ departDate: 'asc' }, { departTime: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toRecord);
  }

  async find(tripId: number, id: number): Promise<FlightRecord | null> {
    const row = await prisma.flight.findFirst({ where: { id, tripId } });
    return row && toRecord(row);
  }

  async create(tripId: number, data: FlightData): Promise<FlightRecord> {
    return toRecord(await prisma.flight.create({ data: { ...data, tripId } }));
  }

  async update(id: number, data: FlightData): Promise<FlightRecord> {
    return toRecord(await prisma.flight.update({ where: { id }, data }));
  }

  async delete(id: number): Promise<void> {
    await prisma.flight.delete({ where: { id } });
  }
}
