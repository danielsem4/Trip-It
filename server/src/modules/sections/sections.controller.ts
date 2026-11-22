import type { Request, Response, NextFunction } from 'express';
import type { SectionsService } from './sections.service';
import type { PlaceDto, SectionDto } from './sections.schema';

const ids = (req: Request, res: Response) => ({
  userId: req.currentUser!.userId,
  tripId: res.locals['id'] as number,
  sectionId: res.locals['sectionId'] as number,
  placeId: res.locals['placeId'] as number,
});

export function createSectionsController(service: SectionsService) {
  return {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { userId, tripId } = ids(req, res);
        res.json({ sections: await service.list(userId, tripId) });
      } catch (err) {
        next(err);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { userId, tripId } = ids(req, res);
        const section = await service.create(userId, tripId, req.body as SectionDto);
        res.status(201).json({ section });
      } catch (err) {
        next(err);
      }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { userId, tripId, sectionId } = ids(req, res);
        const section = await service.update(userId, tripId, sectionId, req.body as SectionDto);
        res.json({ section });
      } catch (err) {
        next(err);
      }
    },

    async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { userId, tripId, sectionId } = ids(req, res);
        await service.remove(userId, tripId, sectionId);
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    },

    async createPlace(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { userId, tripId, sectionId } = ids(req, res);
        const place = await service.createPlace(userId, tripId, sectionId, req.body as PlaceDto);
        res.status(201).json({ place });
      } catch (err) {
        next(err);
      }
    },

    async updatePlace(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { userId, tripId, sectionId, placeId } = ids(req, res);
        const place = await service.updatePlace(userId, tripId, sectionId, placeId, req.body as PlaceDto);
        res.json({ place });
      } catch (err) {
        next(err);
      }
    },

    async setPlaceDone(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { userId, tripId, sectionId, placeId } = ids(req, res);
        const { done } = req.body as { done: boolean };
        const place = await service.setPlaceDone(userId, tripId, sectionId, placeId, done);
        res.json({ place });
      } catch (err) {
        next(err);
      }
    },

    async removePlace(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { userId, tripId, sectionId, placeId } = ids(req, res);
        await service.removePlace(userId, tripId, sectionId, placeId);
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    },
  };
}
