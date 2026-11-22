import { z } from 'zod';
import {
  NOTES_MAX,
  isoDate,
  optionalText,
  optionalTime,
  optionalUrl,
  priceFields,
  requiredText,
} from '../../shared/schemas/fields';

export const STAY_TYPES = ['HOTEL', 'APARTMENT', 'OTHER'] as const;

export const staySchema = z
  .object({
    type: z.enum(STAY_TYPES),
    name: requiredText(150),
    address: optionalText(300),
    mapUrl: optionalUrl,
    checkInDate: isoDate,
    checkInTime: optionalTime,
    checkOutDate: isoDate,
    checkOutTime: optionalTime,
    confirmation: optionalText(100),
    website: optionalUrl,
    phone: optionalText(50),
    notes: optionalText(NOTES_MAX),
    ...priceFields,
  })
  .refine((d) => !d.checkOutDate || d.checkOutDate >= d.checkInDate, {
    message: 'checkOutDate must be on or after checkInDate',
    path: ['checkOutDate'],
  });

export type StayDto = z.infer<typeof staySchema>;
