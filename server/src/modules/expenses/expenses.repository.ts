import type { Expense } from '@prisma/client';
import prisma from '../../lib/prisma';
import type { ITripItemRepository } from '../../shared/tripItems/tripItem.types';
import type { ExpenseData, ExpenseRecord } from './expenses.types';

const toRecord = ({ createdAt: _c, updatedAt: _u, priceAmount, ...rest }: Expense): ExpenseRecord => ({
  ...rest,
  priceAmount: priceAmount.toNumber(),
});

export class ExpensesRepository implements ITripItemRepository<ExpenseRecord, ExpenseData> {
  async list(tripId: number): Promise<ExpenseRecord[]> {
    const rows = await prisma.expense.findMany({ where: { tripId }, orderBy: { id: 'asc' } });
    return rows.map(toRecord);
  }

  async find(tripId: number, id: number): Promise<ExpenseRecord | null> {
    const row = await prisma.expense.findFirst({ where: { id, tripId } });
    return row && toRecord(row);
  }

  async create(tripId: number, data: ExpenseData): Promise<ExpenseRecord> {
    return toRecord(await prisma.expense.create({ data: { ...data, tripId } }));
  }

  async update(id: number, data: ExpenseData): Promise<ExpenseRecord> {
    return toRecord(await prisma.expense.update({ where: { id }, data }));
  }

  async delete(id: number): Promise<void> {
    await prisma.expense.delete({ where: { id } });
  }
}
