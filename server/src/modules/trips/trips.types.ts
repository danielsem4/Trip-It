export type TripRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface TripMemberShape {
  userId: number;
  name: string | null;
  email: string;
  role: TripRole;
}

export interface TripShape {
  id: number;
  title: string;
  destination: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string | null; // 'YYYY-MM-DD'
  coverColor: string;
  coverImageUrl: string | null;
  currency: string; // main currency, ISO 4217
  myRole: TripRole;
  members: TripMemberShape[]; // owner first
}

export interface TripRecord {
  id: number;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date | null;
  coverColor: string;
  coverImageUrl: string | null;
  currency: string;
  budgetAmount: number | null;
  members: { userId: number; role: TripRole; user: { name: string | null; email: string } }[];
}

export interface TripWriteData {
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date | null;
  coverColor: string;
  coverImageUrl?: string | null;
  currency?: string;
  budgetAmount?: number | null;
}

export interface ITripsRepository {
  listForUser(userId: number): Promise<TripRecord[]>;
  findById(tripId: number): Promise<TripRecord | null>;
  createWithOwner(userId: number, data: TripWriteData): Promise<TripRecord>;
  update(tripId: number, data: Partial<TripWriteData>): Promise<TripRecord>;
  delete(tripId: number): Promise<void>;
}
