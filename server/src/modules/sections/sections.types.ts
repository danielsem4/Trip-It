import type { Place } from '@prisma/client';

export type SectionKind = 'ATTRACTIONS' | 'RESTAURANTS' | 'CUSTOM';

export type PlaceRecord = Omit<Place, 'createdAt' | 'updatedAt' | 'priceAmount'> & {
  priceAmount: number | null;
};
// The photo is found by the server, never sent by the client.
export type PlacePhoto = Pick<PlaceRecord, 'photoUrl' | 'photoCheckedAt'>;
export type PlaceData = Omit<PlaceRecord, 'id' | 'sectionId' | keyof PlacePhoto>;

export type PlaceShape = Omit<PlaceRecord, 'sectionId' | 'date' | 'photoCheckedAt'> & {
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

export interface SectionsList {
  sections: SectionShape[];
  // Photo lookups still running: the client asks again while this is above zero.
  pendingPhotos: number;
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
  updatePlace(placeId: number, data: Partial<PlaceData & PlacePhoto>): Promise<PlaceRecord>;
  deletePlace(placeId: number): Promise<void>;
}
