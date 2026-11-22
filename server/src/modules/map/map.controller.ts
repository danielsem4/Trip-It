import type { Request, Response, NextFunction } from 'express';
import type { MapService } from './map.service';

export function createMapController(service: MapService) {
  return {
    async get(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const map = await service.get(req.currentUser!.userId, res.locals['id'] as number);
        res.json({ map });
      } catch (err) {
        next(err);
      }
    },
  };
}
