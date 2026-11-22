import type { Router } from 'express';
import { createTripItemRouter } from '../../shared/tripItems/tripItem.routes';
import type { TripAccess } from '../../shared/tripItems/tripItem.types';
import { ExpensesRepository } from './expenses.repository';
import { ExpensesService, expenseMapper } from './expenses.service';
import { expenseSchema } from './expenses.schema';

// Mounted at /api/trips/:id/expenses
export function createExpensesRouter(access: TripAccess): Router {
  const service = new ExpensesService(new ExpensesRepository(), access, expenseMapper);
  return createTripItemRouter(service, {
    schema: expenseSchema,
    one: 'expense',
    many: 'expenses',
    notFound: expenseMapper.notFound,
  });
}
