import type { Place } from '@prisma/client';

export type SectionKind = 'ATTRACTIONS' | 'RESTAURANTS' | 'CUSTOM';

export type PlaceRecord = Omit<Place, 'createdAt' | 'updatedAt' | 'priceAmount'> & {
  priceAmount: number | null;
};
export type PlaceData = Omit<PlaceRecord, 'id' | 'sectionId'>;

export type PlaceShape = Omit<PlaceRecord, 'sectionId' | 'date'> & {
  date: string | null; // 'YYYY-MM-DD'
};

export interface SectionRecord {
  id: number;
  tripId: number;
  kind: SectionKind;
  name: string | null;
  icon: string | null;
  places: PlaceRecord[];
}

export interface SectionShape {
  id: number;
  kind: SectionKind;
  name: string | null; // null for the built-in kinds
  icon: string | null;
  places: PlaceShape[];
}

export interface ISectionsRepository {
  // Built-in sections first, then custom ones in creation order; places by date, then time.
  list(tripId: number): Promise<SectionRecord[]>;
  // Scoped by trip: a section of another trip is not found.
  find(tripId: number, sectionId: number): Promise<SectionRecord | null>;
  createCustom(tripId: number, data: { name: string; icon: string }): Promise<SectionRecord>;
  update(sectionId: number, data: { name: string; icon: string }): Promise<SectionRecord>;
  delete(sectionId: number): Promise<void>;
  createPlace(sectionId: number, data: PlaceData): Promise<PlaceRecord>;
  updatePlace(placeId: number, data: Partial<PlaceData>): Promise<PlaceRecord>;
  deletePlace(placeId: number): Promise<void>;
}
