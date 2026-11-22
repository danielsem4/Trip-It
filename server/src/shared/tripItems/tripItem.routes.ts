import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';
import { parseIdParam } from '../middlewares/parseIdParam';
import type { TripItemService } from './tripItem.service';

interface TripItemRouterOptions {
  schema: z.ZodType;
  // Response keys, e.g. { one: 'flight', many: 'flights' }
  one: string;
  many: string;
  notFound: string;
}

// Routes for a TripItemService. Mount under /trips/:id/<many> after parseIdParam() so that
// res.locals['id'] holds the trip id.
export function createTripItemRouter<TRecord extends { id: number }, TDto, TData, TShape>(
  service: TripItemService<TRecord, TDto, TData, TShape>,
  { schema, one, many, notFound }: TripItemRouterOptions,
): Router {
  const router = Router({ mergeParams: true });
  const itemId = parseIdParam('itemId', notFound);

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await service.list(req.currentUser!.userId, res.locals['id'] as number);
      res.json({ [many]: items });
    } catch (err) {
      next(err);
    }
  });

  router.post('/', validateRequest(schema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await service.create(
        req.currentUser!.userId,
        res.locals['id'] as number,
        req.body as TDto,
      );
      res.status(201).json({ [one]: item });
    } catch (err) {
      next(err);
    }
  });

  router.put(
    '/:itemId',
    itemId,
    validateRequest(schema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const item = await service.update(
          req.currentUser!.userId,
          res.locals['id'] as number,
          res.locals['itemId'] as number,
          req.body as TDto,
        );
        res.json({ [one]: item });
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete('/:itemId', itemId, async (req: Request, res: Response, next: NextFunction) => {
    try {
      await service.remove(
        req.currentUser!.userId,
        res.locals['id'] as number,
        res.locals['itemId'] as number,
      );
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
