import type { Request, Response, NextFunction } from 'express';
import type { InvitesService } from './invites.service';
import type { InviteDto } from './invites.schema';

export function createInvitesController(service: InvitesService) {
  const tripIds = (req: Request, res: Response) => ({
    userId: req.currentUser!.userId,
    tripId: res.locals['id'] as number,
  });
  const token = (req: Request) => String(req.params['token']);

  return {
    async get(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { userId, tripId } = tripIds(req, res);
        res.json({ invite: await service.get(userId, tripId) });
      } catch (err) {
        next(err);
      }
    },

    async save(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { userId, tripId } = tripIds(req, res);
        res.json({ invite: await service.save(userId, tripId, (req.body as InviteDto).role) });
      } catch (err) {
        next(err);
      }
    },

    async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { userId, tripId } = tripIds(req, res);
        await service.remove(userId, tripId);
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    },

    async preview(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        res.json({ invite: await service.preview(req.currentUser!.userId, token(req)) });
      } catch (err) {
        next(err);
      }
    },

    async accept(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        res.json(await service.accept(req.currentUser!.userId, token(req)));
      } catch (err) {
        next(err);
      }
    },
  };
}
