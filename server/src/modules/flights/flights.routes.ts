import type { Router } from 'express';
import { createTripItemRouter } from '../../shared/tripItems/tripItem.routes';
import type { TripAccess } from '../../shared/tripItems/tripItem.types';
import { FlightsRepository } from './flights.repository';
import { FlightsService, flightMapper } from './flights.service';
import { flightSchema } from './flights.schema';

// Mounted at /api/trips/:id/flights
export function createFlightsRouter(access: TripAccess): Router {
  const service = new FlightsService(new FlightsRepository(), access, flightMapper);
  return createTripItemRouter(service, {
    schema: flightSchema,
    one: 'flight',
    many: 'flights',
    notFound: flightMapper.notFound,
  });
}
