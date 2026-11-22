import { Router } from 'express';
import type { TripAccess } from '../../shared/tripItems/tripItem.types';
import { NominatimGeocoder } from './geocoder';
import { MapRepository } from './map.repository';
import { MapService } from './map.service';
import { createMapController } from './map.controller';

// Mounted at /api/trips/:id/map
export function createMapRouter(access: TripAccess): Router {
  const repository = new MapRepository();
  const geocoder = new NominatimGeocoder(repository, { baseUrl: process.env['GEOCODER_URL'] || undefined });
  const controller = createMapController(new MapService(repository, repository, geocoder, access));

  const router = Router({ mergeParams: true });
  router.get('/', controller.get);
  return router;
}
