export interface BudgetLine {
  // 'flights' | 'stays' | 'transport' | 'expenses' | `section:${id}`
  group: string;
  amount: number;
  currency: string;
}

export interface BudgetGroup {
  key: string;
  total: number; // main currency; lines without a rate are left out
  count: number; // every priced line, converted or not
}

export interface BudgetSummary {
  groups: BudgetGroup[];
  total: number;
  remaining: number | null; // null when no budget is set
  // Foreign currencies in use that have no rate yet, and how much is waiting in each.
  unconverted: { currency: string; amount: number }[];
}

interface SummarizeInput {
  mainCurrency: string;
  budgetAmount: number | null;
  // 1 unit of the key currency = value units of the main currency
  rates: Record<string, number>;
  lines: BudgetLine[];
}

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export function summarizeBudget({ mainCurrency, budgetAmount, rates, lines }: SummarizeInput): BudgetSummary {
  const groups = new Map<string, BudgetGroup>();
  const unconverted = new Map<string, number>();
  let total = 0;

  for (const { group, amount, currency } of lines) {
    const entry = groups.get(group) ?? { key: group, total: 0, count: 0 };
    groups.set(group, entry);
    entry.count += 1;

    const rate = currency === mainCurrency ? 1 : rates[currency];
    if (rate === undefined) {
      unconverted.set(currency, (unconverted.get(currency) ?? 0) + amount);
      continue;
    }
    entry.total += amount * rate;
    total += amount * rate;
  }

  return {
    groups: [...groups.values()].map((g) => ({ ...g, total: round2(g.total) })),
    total: round2(total),
    remaining: budgetAmount === null ? null : round2(budgetAmount - total),
    unconverted: [...unconverted.entries()]
      .map(([currency, amount]) => ({ currency, amount: round2(amount) }))
      .sort((a, b) => a.currency.localeCompare(b.currency)),
  };
}
