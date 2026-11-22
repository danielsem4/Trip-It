import type { Request, Response, NextFunction } from 'express';
import type { TripsService } from './trips.service';
import fs from 'fs';
import { AppError } from '../../shared/errors/AppError';
import { deleteCoverFile } from './trips.upload';
import type { CreateTripDto, UpdateTripDto } from './trips.schema';

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
        const { coverImageUrl } = await service.remove(req.currentUser!.userId, res.locals['id'] as number);
        await deleteCoverFile(coverImageUrl).catch(() => undefined);
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    },

    async setCover(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        if (!req.file) throw new AppError('Cover image is required', 400);
        const filePath = req.file.path;
        try {
          const { trip, previousUrl } = await service.setCoverImage(
            req.currentUser!.userId,
            res.locals['id'] as number,
            `/api/uploads/covers/${req.file.filename}`,
          );
          await deleteCoverFile(previousUrl).catch(() => undefined);
          res.json({ trip });
        } catch (err) {
          await fs.promises.unlink(filePath).catch(() => undefined);
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
