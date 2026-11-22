import { z } from 'zod';

// Building blocks for trip-content schemas. Optional fields always parse to `value | null`,
// so an update replaces the whole item and services never deal with `undefined`.

export const isoDate = z.iso.date();
export const optionalDate = isoDate.nullish().transform((v) => v ?? null);

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/; // 'HH:mm'
export const optionalTime = z
  .string()
  .regex(TIME, 'time must be HH:mm')
  .nullish()
  .transform((v) => v ?? null);

export const requiredText = (max = 200) => z.string().trim().min(1).max(max);
export const optionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

export const NOTES_MAX = 2000;

// Links are rendered as <a href>, so only http(s) is allowed.
export const optionalUrl = z
  .string()
  .trim()
  .max(1000)
  .regex(/^https?:\/\/\S+$/i, 'link must start with http:// or https://')
  .nullish()
  .or(z.literal(''))
  .transform((v) => v || null);

export const currencyCode = z.string().regex(/^[A-Z]{3}$/, 'currency must be a 3-letter code');
const amount = z.number().finite().min(0).max(9_999_999_999.99);

export const requiredAmount = amount;
export const priceFields = {
  priceAmount: amount.nullish().transform((v) => v ?? null),
  priceCurrency: currencyCode.nullish().transform((v) => v ?? null),
};
