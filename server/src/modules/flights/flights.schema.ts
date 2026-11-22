import { z } from 'zod';
import {
  NOTES_MAX,
  isoDate,
  optionalDate,
  optionalText,
  optionalTime,
  priceFields,
  requiredText,
} from '../../shared/schemas/fields';

export const flightSchema = z
  .object({
    airline: optionalText(100),
    flightNumber: requiredText(20),
    fromAirport: requiredText(100),
    toAirport: requiredText(100),
    departDate: isoDate,
    departTime: optionalTime,
    arriveDate: optionalDate,
    arriveTime: optionalTime,
    terminal: optionalText(50),
    confirmation: optionalText(100),
    seat: optionalText(50),
    notes: optionalText(NOTES_MAX),
    ...priceFields,
  })
  .refine((d) => !d.arriveDate || d.arriveDate >= d.departDate, {
    message: 'arriveDate must be on or after departDate',
    path: ['arriveDate'],
  });

export type FlightDto = z.infer<typeof flightSchema>;
