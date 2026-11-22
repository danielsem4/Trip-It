import type { Transport } from '@prisma/client';

export type TransportRecord = Omit<Transport, 'createdAt' | 'updatedAt' | 'priceAmount'> & {
  priceAmount: number | null;
};
export type TransportData = Omit<TransportRecord, 'id' | 'tripId'>;

export type TransportShape = Omit<TransportRecord, 'tripId' | 'date' | 'endDate'> & {
  date: string; // 'YYYY-MM-DD'
  endDate: string | null;
};
