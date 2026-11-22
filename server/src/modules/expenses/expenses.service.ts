import { toDateOrNull, toDayOrNull } from '../../shared/utils/dates';
import { TripItemService } from '../../shared/tripItems/tripItem.service';
import type { TripItemMapper } from '../../shared/tripItems/tripItem.types';
import type { ExpenseDto } from './expenses.schema';
import type { ExpenseData, ExpenseRecord, ExpenseShape } from './expenses.types';

export const expenseMapper: TripItemMapper<ExpenseRecord, ExpenseDto, ExpenseData, ExpenseShape> = {
  notFound: 'Expense not found',
  toData: (dto, trip) => ({
    ...dto,
    date: toDateOrNull(dto.date),
    priceCurrency: dto.priceCurrency ?? trip.currency,
  }),
  toShape: ({ tripId: _tripId, ...record }) => ({ ...record, date: toDayOrNull(record.date) }),
};

export class ExpensesService extends TripItemService<
  ExpenseRecord,
  ExpenseDto,
  ExpenseData,
  ExpenseShape
> {}
