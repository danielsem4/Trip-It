import { Router } from 'express';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { parseIdParam } from '../../shared/middlewares/parseIdParam';
import type { TripAccess } from '../../shared/tripItems/tripItem.types';
import { placePhotos } from '../photos/placePhotos';
import { placeDoneSchema, placeSchema, sectionSchema } from './sections.schema';
import { SectionsRepository } from './sections.repository';
import { SectionsService } from './sections.service';
import { createSectionsController } from './sections.controller';

// Mounted at /api/trips/:id/sections
export function createSectionsRouter(access: TripAccess): Router {
  const controller = createSectionsController(new SectionsService(new SectionsRepository(), access, placePhotos));
  const sectionId = parseIdParam('sectionId', 'Section not found');
  const placeId = parseIdParam('placeId', 'Place not found');

  const router = Router({ mergeParams: true });
  router.get('/', controller.list);
  router.post('/', validateRequest(sectionSchema), controller.create);
  router.put('/:sectionId', sectionId, validateRequest(sectionSchema), controller.update);
  router.delete('/:sectionId', sectionId, controller.remove);
  router.post('/:sectionId/places', sectionId, validateRequest(placeSchema), controller.createPlace);
  router.put(
    '/:sectionId/places/:placeId',
    sectionId,
    placeId,
    validateRequest(placeSchema),
    controller.updatePlace,
  );
  router.patch(
    '/:sectionId/places/:placeId/done',
    sectionId,
    placeId,
    validateRequest(placeDoneSchema),
    controller.setPlaceDone,
  );
  router.delete('/:sectionId/places/:placeId', sectionId, placeId, controller.removePlace);
  return router;
}
