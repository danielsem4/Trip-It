import { toDate, toDay } from '../../shared/utils/dates';
import { normalizePrice } from '../../shared/utils/price';
import { TripItemService } from '../../shared/tripItems/tripItem.service';
import type { TripItemMapper } from '../../shared/tripItems/tripItem.types';
import type { StayDto } from './stays.schema';
import type { StayData, StayRecord, StayShape } from './stays.types';

export const stayMapper: TripItemMapper<StayRecord, StayDto, StayData, StayShape> = {
  notFound: 'Stay not found',
  toData: (dto, trip) => ({
    ...dto,
    checkInDate: toDate(dto.checkInDate),
    checkOutDate: toDate(dto.checkOutDate),
    ...normalizePrice(dto, trip.currency),
  }),
  toShape: ({ tripId: _tripId, ...record }) => ({
    ...record,
    checkInDate: toDay(record.checkInDate),
    checkOutDate: toDay(record.checkOutDate),
  }),
};

export class StaysService extends TripItemService<StayRecord, StayDto, StayData, StayShape> {}
