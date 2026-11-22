import { describe, expect, it } from 'vitest';
import { summarizeBudget } from './budget.math';

const base = { mainCurrency: 'ILS', budgetAmount: 9000, rates: { EUR: 4 } };

describe('summarizeBudget', () => {
  it('sums main-currency lines per group', () => {
    const s = summarizeBudget({
      ...base,
      lines: [
        { group: 'flights', amount: 1200, currency: 'ILS' },
        { group: 'flights', amount: 800.5, currency: 'ILS' },
        { group: 'stays', amount: 3000, currency: 'ILS' },
      ],
    });
    expect(s.groups).toEqual([
      { key: 'flights', total: 2000.5, count: 2 },
      { key: 'stays', total: 3000, count: 1 },
    ]);
    expect(s.total).toBe(5000.5);
    expect(s.remaining).toBe(3999.5);
    expect(s.unconverted).toEqual([]);
  });

  it('converts foreign currencies with the trip rates', () => {
    const s = summarizeBudget({
      ...base,
      lines: [
        { group: 'stays', amount: 500, currency: 'EUR' },
        { group: 'section:7', amount: 12.5, currency: 'EUR' },
      ],
    });
    expect(s.groups).toEqual([
      { key: 'stays', total: 2000, count: 1 },
      { key: 'section:7', total: 50, count: 1 },
    ]);
    expect(s.total).toBe(2050);
  });

  it('leaves out currencies without a rate and reports them', () => {
    const s = summarizeBudget({
      ...base,
      lines: [
        { group: 'flights', amount: 100, currency: 'ILS' },
        { group: 'flights', amount: 300, currency: 'USD' },
        { group: 'transport', amount: 20, currency: 'USD' },
        { group: 'transport', amount: 5, currency: 'GBP' },
      ],
    });
    expect(s.total).toBe(100);
    expect(s.groups).toEqual([
      { key: 'flights', total: 100, count: 2 },
      { key: 'transport', total: 0, count: 2 },
    ]);
    expect(s.unconverted).toEqual([
      { currency: 'GBP', amount: 5 },
      { currency: 'USD', amount: 320 },
    ]);
  });

  it('ignores a rate entered for the main currency itself', () => {
    const s = summarizeBudget({
      ...base,
      rates: { ILS: 3 },
      lines: [{ group: 'expenses', amount: 10, currency: 'ILS' }],
    });
    expect(s.total).toBe(10);
  });

  it('has no remaining amount without a budget, and can go negative with one', () => {
    const lines = [{ group: 'flights', amount: 150, currency: 'ILS' }];
    expect(summarizeBudget({ ...base, budgetAmount: null, lines }).remaining).toBeNull();
    expect(summarizeBudget({ ...base, budgetAmount: 100, lines }).remaining).toBe(-50);
  });

  it('rounds totals to two decimals', () => {
    const s = summarizeBudget({
      ...base,
      rates: { EUR: 4.0321 },
      lines: [
        { group: 'stays', amount: 0.1, currency: 'ILS' },
        { group: 'stays', amount: 0.2, currency: 'ILS' },
        { group: 'stays', amount: 9.99, currency: 'EUR' },
      ],
    });
    expect(s.total).toBe(40.58);
    expect(s.groups[0].total).toBe(40.58);
  });
});
