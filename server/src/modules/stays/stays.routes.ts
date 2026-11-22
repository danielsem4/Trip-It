import type { Router } from 'express';
import { createTripItemRouter } from '../../shared/tripItems/tripItem.routes';
import type { TripAccess } from '../../shared/tripItems/tripItem.types';
import { StaysRepository } from './stays.repository';
import { StaysService, stayMapper } from './stays.service';
import { staySchema } from './stays.schema';

// Mounted at /api/trips/:id/stays
export function createStaysRouter(access: TripAccess): Router {
  const service = new StaysService(new StaysRepository(), access, stayMapper);
  return createTripItemRouter(service, {
    schema: staySchema,
    one: 'stay',
    many: 'stays',
    notFound: stayMapper.notFound,
  });
}
