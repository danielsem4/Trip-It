import { z } from 'zod';
import {
  NOTES_MAX,
  currencyCode,
  optionalDate,
  optionalText,
  requiredAmount,
  requiredText,
} from '../../shared/schemas/fields';

export const expenseSchema = z.object({
  title: requiredText(150),
  date: optionalDate,
  notes: optionalText(NOTES_MAX),
  priceAmount: requiredAmount,
  priceCurrency: currencyCode.nullish().transform((v) => v ?? null),
});

export type ExpenseDto = z.infer<typeof expenseSchema>;
