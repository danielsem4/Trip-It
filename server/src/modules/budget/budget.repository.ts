import prisma from '../../lib/prisma';
import type { BudgetLine } from './budget.math';
import type { IBudgetRepository, RateShape } from './budget.types';

interface PricedRow {
  priceAmount: { toNumber(): number } | null;
  priceCurrency: string | null;
}

const priced = { priceAmount: { not: null } } as const;
const select = { priceAmount: true, priceCurrency: true } as const;

const toLines = (group: string, rows: PricedRow[]): BudgetLine[] =>
  rows.flatMap(({ priceAmount, priceCurrency }) =>
    priceAmount && priceCurrency ? [{ group, amount: priceAmount.toNumber(), currency: priceCurrency }] : [],
  );

export class BudgetRepository implements IBudgetRepository {
  async listLines(tripId: number): Promise<BudgetLine[]> {
    const [flights, stays, transport, places, expenses] = await Promise.all([
      prisma.flight.findMany({ where: { tripId, ...priced }, select }),
      prisma.stay.findMany({ where: { tripId, ...priced }, select }),
      prisma.transport.findMany({ where: { tripId, ...priced }, select }),
      prisma.place.findMany({
        where: { section: { tripId }, ...priced },
        select: { ...select, sectionId: true },
        orderBy: { sectionId: 'asc' },
      }),
      prisma.expense.findMany({ where: { tripId }, select }),
    ]);
    return [
      ...toLines('flights', flights),
      ...toLines('stays', stays),
      ...toLines('transport', transport),
      ...places.flatMap((p) => toLines(`section:${p.sectionId}`, [p])),
      ...toLines('expenses', expenses),
    ];
  }

  async listRates(tripId: number): Promise<RateShape[]> {
    const rows = await prisma.tripCurrencyRate.findMany({
      where: { tripId },
      orderBy: { currency: 'asc' },
    });
    return rows.map((r) => ({ currency: r.currency, rate: r.rate.toNumber() }));
  }

  async updateSettings(
    tripId: number,
    data: { currency: string; budgetAmount: number | null },
    clearRates: boolean,
  ): Promise<void> {
    await prisma.$transaction([
      prisma.trip.update({ where: { id: tripId }, data }),
      ...(clearRates ? [prisma.tripCurrencyRate.deleteMany({ where: { tripId } })] : []),
    ]);
  }

  async setRate(tripId: number, currency: string, rate: number): Promise<void> {
    await prisma.tripCurrencyRate.upsert({
      where: { tripId_currency: { tripId, currency } },
      create: { tripId, currency, rate },
      update: { rate },
    });
  }

  async deleteRate(tripId: number, currency: string): Promise<void> {
    await prisma.tripCurrencyRate.deleteMany({ where: { tripId, currency } });
  }
}
