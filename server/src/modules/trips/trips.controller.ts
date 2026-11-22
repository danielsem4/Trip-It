import type { Request, Response, NextFunction } from 'express';
import type { TripsService } from './trips.service';
import { AppError } from '../../shared/errors/AppError';
import { deleteCoverFile, saveCoverFile } from './trips.upload';
import { placePhotos } from '../photos/placePhotos';
import type { CreateTripDto, UpdateTripDto } from './trips.schema';
import type { GuestRole } from './trips.types';

export function createTripsController(service: TripsService) {
  return {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const trips = await service.list(req.currentUser!.userId);
        res.json({ trips });
      } catch (err) {
        next(err);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const trip = await service.create(req.currentUser!.userId, req.body as CreateTripDto);
        res.status(201).json({ trip });
      } catch (err) {
        next(err);
      }
    },

    async get(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const trip = await service.get(req.currentUser!.userId, res.locals['id'] as number);
        res.json({ trip });
      } catch (err) {
        next(err);
      }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const trip = await service.update(
          req.currentUser!.userId,
          res.locals['id'] as number,
          req.body as UpdateTripDto,
        );
        res.json({ trip });
      } catch (err) {
        next(err);
      }
    },

    async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { coverImageUrl, placePhotoUrls } = await service.remove(
          req.currentUser!.userId,
          res.locals['id'] as number,
        );
        await deleteCoverFile(coverImageUrl).catch(() => undefined);
        await Promise.all(placePhotoUrls.map((url) => placePhotos.discard(url)));
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    },

    async setMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const trip = await service.setMemberRole(
          req.currentUser!.userId,
          res.locals['id'] as number,
          res.locals['userId'] as number,
          (req.body as { role: GuestRole }).role,
        );
        res.json({ trip });
      } catch (err) {
        next(err);
      }
    },

    async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        await service.removeMember(
          req.currentUser!.userId,
          res.locals['id'] as number,
          res.locals['userId'] as number,
        );
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    },

    async setCover(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        if (!req.file) throw new AppError('Cover image is required', 400);
        const tripId = res.locals['id'] as number;
        const url = await saveCoverFile(tripId, req.file);
        try {
          const { trip, previousUrl } = await service.setCoverImage(req.currentUser!.userId, tripId, url);
          await deleteCoverFile(previousUrl).catch(() => undefined);
          res.json({ trip });
        } catch (err) {
          await deleteCoverFile(url).catch(() => undefined);
          throw err;
        }
      } catch (err) {
        next(err);
      }
    },

    async removeCover(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { trip, previousUrl } = await service.setCoverImage(
          req.currentUser!.userId,
          res.locals['id'] as number,
          null,
        );
        await deleteCoverFile(previousUrl).catch(() => undefined);
        res.json({ trip });
      } catch (err) {
        next(err);
      }
    },
  };
}
