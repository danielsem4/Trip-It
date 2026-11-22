import type { Flight } from '@prisma/client';

export type FlightRecord = Omit<Flight, 'createdAt' | 'updatedAt' | 'priceAmount'> & {
  priceAmount: number | null;
};
export type FlightData = Omit<FlightRecord, 'id' | 'tripId'>;

export type FlightShape = Omit<FlightRecord, 'tripId' | 'departDate' | 'arriveDate'> & {
  departDate: string; // 'YYYY-MM-DD'
  arriveDate: string | null;
};
