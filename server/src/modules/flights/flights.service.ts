import { toDate, toDateOrNull, toDay, toDayOrNull } from '../../shared/utils/dates';
import { normalizePrice } from '../../shared/utils/price';
import { TripItemService } from '../../shared/tripItems/tripItem.service';
import type { TripItemMapper } from '../../shared/tripItems/tripItem.types';
import type { FlightDto } from './flights.schema';
import type { FlightData, FlightRecord, FlightShape } from './flights.types';

export const flightMapper: TripItemMapper<FlightRecord, FlightDto, FlightData, FlightShape> = {
  notFound: 'Flight not found',
  toData: (dto, trip) => ({
    ...dto,
    departDate: toDate(dto.departDate),
    arriveDate: toDateOrNull(dto.arriveDate),
    ...normalizePrice(dto, trip.currency),
  }),
  toShape: ({ tripId: _tripId, ...record }) => ({
    ...record,
    departDate: toDay(record.departDate),
    arriveDate: toDayOrNull(record.arriveDate),
  }),
};

export class FlightsService extends TripItemService<FlightRecord, FlightDto, FlightData, FlightShape> {}
