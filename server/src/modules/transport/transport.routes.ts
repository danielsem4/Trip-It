import type { Router } from 'express';
import { createTripItemRouter } from '../../shared/tripItems/tripItem.routes';
import type { TripAccess } from '../../shared/tripItems/tripItem.types';
import { TransportRepository } from './transport.repository';
import { TransportService, transportMapper } from './transport.service';
import { transportSchema } from './transport.schema';

// Mounted at /api/trips/:id/transport
export function createTransportRouter(access: TripAccess): Router {
  const service = new TransportService(new TransportRepository(), access, transportMapper);
  return createTripItemRouter(service, {
    schema: transportSchema,
    one: 'transport',
    many: 'transports',
    notFound: transportMapper.notFound,
  });
}
