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

export const TRANSPORT_TYPES = [
  'TRAIN',
  'BUS',
  'CAR_RENTAL',
  'TAXI',
  'FERRY',
  'TRANSFER',
  'OTHER',
] as const;

export const transportSchema = z
  .object({
    type: z.enum(TRANSPORT_TYPES),
    title: requiredText(150),
    fromPlace: optionalText(150),
    toPlace: optionalText(150),
    date: isoDate,
    time: optionalTime,
    endDate: optionalDate,
    endTime: optionalTime,
    provider: optionalText(100),
    confirmation: optionalText(100),
    notes: optionalText(NOTES_MAX),
    ...priceFields,
  })
  .refine((d) => !d.endDate || d.endDate >= d.date, {
    message: 'endDate must be on or after date',
    path: ['endDate'],
  });

export type TransportDto = z.infer<typeof transportSchema>;
