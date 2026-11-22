import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function parseIdParam(name = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const raw = req.params[name];
    const id = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isSafeInteger(id) || id <= 0) {
      next(new AppError('Trip not found', 404));
      return;
    }
    res.locals['id'] = id;
    next();
  };
}
