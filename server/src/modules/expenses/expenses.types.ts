import type { Expense } from '@prisma/client';

export type ExpenseRecord = Omit<Expense, 'createdAt' | 'updatedAt' | 'priceAmount'> & {
  priceAmount: number;
};
export type ExpenseData = Omit<ExpenseRecord, 'id' | 'tripId'>;

export type ExpenseShape = Omit<ExpenseRecord, 'tripId' | 'date'> & {
  date: string | null; // 'YYYY-MM-DD'
};
