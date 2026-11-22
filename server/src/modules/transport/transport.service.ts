import { toDate, toDateOrNull, toDay, toDayOrNull } from '../../shared/utils/dates';
import { normalizePrice } from '../../shared/utils/price';
import { TripItemService } from '../../shared/tripItems/tripItem.service';
import type { TripItemMapper } from '../../shared/tripItems/tripItem.types';
import type { TransportDto } from './transport.schema';
import type { TransportData, TransportRecord, TransportShape } from './transport.types';

export const transportMapper: TripItemMapper<
  TransportRecord,
  TransportDto,
  TransportData,
  TransportShape
> = {
  notFound: 'Transport not found',
  toData: (dto, trip) => ({
    ...dto,
    date: toDate(dto.date),
    endDate: toDateOrNull(dto.endDate),
    ...normalizePrice(dto, trip.currency),
  }),
  toShape: ({ tripId: _tripId, ...record }) => ({
    ...record,
    date: toDay(record.date),
    endDate: toDayOrNull(record.endDate),
  }),
};

export class TransportService extends TripItemService<
  TransportRecord,
  TransportDto,
  TransportData,
  TransportShape
> {}
