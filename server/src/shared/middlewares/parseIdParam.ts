import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

// Ids are Postgres INT4
const MAX_INT4 = 2_147_483_647

// Parses the `name` route param into res.locals[name]; anything that can't be an id is a 404.
export function parseIdParam(name = 'id', notFound = 'Trip not found') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const raw = req.params[name];
    const id = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isSafeInteger(id) || id <= 0 || id > MAX_INT4) {
      next(new AppError(notFound, 404));
      return;
    }
    res.locals[name] = id;
    next();
  };
}
