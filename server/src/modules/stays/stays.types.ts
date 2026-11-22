import type { Stay } from '@prisma/client';

export type StayRecord = Omit<Stay, 'createdAt' | 'updatedAt' | 'priceAmount'> & {
  priceAmount: number | null;
};
export type StayData = Omit<StayRecord, 'id' | 'tripId'>;

export type StayShape = Omit<StayRecord, 'tripId' | 'checkInDate' | 'checkOutDate'> & {
  checkInDate: string; // 'YYYY-MM-DD'
  checkOutDate: string;
};
