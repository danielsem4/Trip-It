import type { BudgetLine, BudgetSummary } from './budget.math';

export interface RateShape {
  currency: string;
  rate: number; // 1 unit of `currency` = `rate` units of the trip's main currency
}

export interface BudgetShape extends BudgetSummary {
  currency: string;
  budgetAmount: number | null;
  rates: RateShape[];
}

export interface IBudgetRepository {
  // Every priced item in the trip, from all sections plus the extra expenses.
  listLines(tripId: number): Promise<BudgetLine[]>;
  listRates(tripId: number): Promise<RateShape[]>;
  // Rates are relative to the main currency, so changing it must clear them.
  updateSettings(
    tripId: number,
    data: { currency: string; budgetAmount: number | null },
    clearRates: boolean,
  ): Promise<void>;
  setRate(tripId: number, currency: string, rate: number): Promise<void>;
  deleteRate(tripId: number, currency: string): Promise<void>;
}
