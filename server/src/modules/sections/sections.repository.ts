import type { Place, Prisma } from '@prisma/client';
import prisma from '../../lib/prisma';
import { num } from '../../shared/utils/price';
import type { ISectionsRepository, PlaceData, PlacePhoto, PlaceRecord, SectionRecord } from './sections.types';

const include = {
  places: {
    orderBy: [
      { date: { sort: 'asc' as const, nulls: 'last' as const } },
      { time: { sort: 'asc' as const, nulls: 'last' as const } },
      { id: 'asc' as const },
    ],
  },
};

type SectionRow = Prisma.TripSectionGetPayload<{ include: typeof include }>;

const KIND_ORDER = { ATTRACTIONS: 0, RESTAURANTS: 1, CUSTOM: 2 };

const toPlace = ({ createdAt: _c, updatedAt: _u, priceAmount, ...rest }: Place): PlaceRecord => ({
  ...rest,
  priceAmount: num(priceAmount),
});

const toRecord = ({ createdAt: _c, places, ...rest }: SectionRow): SectionRecord => ({
  ...rest,
  places: places.map(toPlace),
});

export class SectionsRepository implements ISectionsRepository {
  async list(tripId: number): Promise<SectionRecord[]> {
    const rows = await prisma.tripSection.findMany({
      where: { tripId },
      include,
      orderBy: { id: 'asc' },
    });
    return rows.map(toRecord).sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
  }

  async find(tripId: number, sectionId: number): Promise<SectionRecord | null> {
    const row = await prisma.tripSection.findFirst({ where: { id: sectionId, tripId }, include });
    return row && toRecord(row);
  }

  async createCustom(tripId: number, data: { name: string; icon: string }): Promise<SectionRecord> {
    const row = await prisma.tripSection.create({
      data: { ...data, tripId, kind: 'CUSTOM' },
      include,
    });
    return toRecord(row);
  }

  async update(sectionId: number, data: { name: string; icon: string }): Promise<SectionRecord> {
    return toRecord(await prisma.tripSection.update({ where: { id: sectionId }, data, include }));
  }

  async delete(sectionId: number): Promise<void> {
    await prisma.tripSection.delete({ where: { id: sectionId } });
  }

  async createPlace(sectionId: number, data: PlaceData): Promise<PlaceRecord> {
    return toPlace(await prisma.place.create({ data: { ...data, sectionId } }));
  }

  async updatePlace(placeId: number, data: Partial<PlaceData & PlacePhoto>): Promise<PlaceRecord> {
    return toPlace(await prisma.place.update({ where: { id: placeId }, data }));
  }

  async deletePlace(placeId: number): Promise<void> {
    await prisma.place.delete({ where: { id: placeId } });
  }
}
