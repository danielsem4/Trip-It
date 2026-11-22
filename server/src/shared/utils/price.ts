interface DecimalLike {
  toNumber(): number;
}

// Prisma Decimal -> plain number at the repository boundary.
export const num = (d: DecimalLike | null): number | null => (d === null ? null : d.toNumber());

export interface Price {
  priceAmount: number | null;
  priceCurrency: string | null;
}

// A price without a currency is in the trip's main currency; no amount means no currency.
export function normalizePrice(
  dto: { priceAmount: number | null; priceCurrency: string | null },
  tripCurrency: string,
): Price {
  if (dto.priceAmount === null) return { priceAmount: null, priceCurrency: null };
  return { priceAmount: dto.priceAmount, priceCurrency: dto.priceCurrency ?? tripCurrency };
}
