import { z } from 'zod';
import { currencyCode, requiredAmount } from '../../shared/schemas/fields';

export const budgetSettingsSchema = z.object({
  currency: currencyCode,
  budgetAmount: requiredAmount.nullable(),
});

export const rateSchema = z.object({
  rate: z.number().positive().max(1_000_000),
});

export type BudgetSettingsDto = z.infer<typeof budgetSettingsSchema>;
