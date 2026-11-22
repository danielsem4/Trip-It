// Calendar dates travel as 'YYYY-MM-DD' strings and are stored as UTC-midnight DATEs.
export const toDate = (s: string): Date => new Date(s + 'T00:00:00Z');
export const toDay = (d: Date): string => d.toISOString().slice(0, 10);

export const toDateOrNull = (s: string | null): Date | null => (s ? toDate(s) : null);
export const toDayOrNull = (d: Date | null): string | null => (d ? toDay(d) : null);
