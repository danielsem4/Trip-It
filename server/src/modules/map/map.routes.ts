import { Router } from 'express';
import type { TripAccess } from '../../shared/tripItems/tripItem.types';
import { geocoder, mapRepository } from './geocoding';
import { MapService } from './map.service';
import { createMapController } from './map.controller';

// Mounted at /api/trips/:id/map
export function createMapRouter(access: TripAccess): Router {
  const controller = createMapController(new MapService(mapRepository, mapRepository, geocoder, access));

  const router = Router({ mergeParams: true });
  router.get('/', controller.get);
  return router;
}
