import { z } from 'zod';
import {
  NOTES_MAX,
  optionalDate,
  optionalText,
  optionalTime,
  optionalUrl,
  priceFields,
  requiredText,
} from '../../shared/schemas/fields';

// Icon keys a custom section can use; the client maps them to icons.
export const SECTION_ICONS = [
  'pin',
  'star',
  'heart',
  'coffee',
  'beer',
  'wine',
  'cake',
  'shopping',
  'store',
  'music',
  'camera',
  'museum',
  'tree',
  'beach',
  'mountain',
  'ticket',
  'gamepad',
  'dumbbell',
  'book',
  'baby',
] as const;

export const sectionSchema = z.object({
  name: requiredText(40),
  icon: z.enum(SECTION_ICONS),
});

export const placeSchema = z.object({
  name: requiredText(150),
  address: optionalText(300),
  mapUrl: optionalUrl,
  date: optionalDate,
  time: optionalTime,
  website: optionalUrl,
  notes: optionalText(NOTES_MAX),
  done: z.boolean().default(false),
  ...priceFields,
});

export const placeDoneSchema = z.object({ done: z.boolean() });

export type SectionDto = z.infer<typeof sectionSchema>;
export type PlaceDto = z.infer<typeof placeSchema>;
