import type { TripRecord, TripRole } from '../../modules/trips/trips.types';

// The one place trip membership is checked (TripsService): 404 for non-members, 403 for a low role.
export interface TripAccess {
  requireRole(userId: number, tripId: number, allowed: TripRole[]): Promise<TripRecord>;
}

export const CAN_VIEW: TripRole[] = ['OWNER', 'EDITOR', 'VIEWER'];
export const CAN_EDIT: TripRole[] = ['OWNER', 'EDITOR'];

// Storage for one kind of item owned directly by a trip (flights, stays, ...).
export interface ITripItemRepository<TRecord, TData> {
  list(tripId: number): Promise<TRecord[]>;
  // Scoped by trip: an id that belongs to another trip is not found.
  find(tripId: number, id: number): Promise<TRecord | null>;
  create(tripId: number, data: TData): Promise<TRecord>;
  update(id: number, data: TData): Promise<TRecord>;
  delete(id: number): Promise<void>;
}

export interface TripItemMapper<TRecord, TDto, TData, TShape> {
  toData(dto: TDto, trip: TripRecord): TData;
  toShape(record: TRecord): TShape;
  notFound: string;
}
