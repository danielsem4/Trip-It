import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/AppError';
import type { BudgetService } from './budget.service';
import type { BudgetSettingsDto } from './budget.schema';

function currencyParam(req: Request): string {
  const raw = req.params['currency'];
  if (typeof raw !== 'string' || !/^[A-Z]{3}$/.test(raw)) {
    throw new AppError('currency must be a 3-letter code', 400);
  }
  return raw;
}

export function createBudgetController(service: BudgetService) {
  return {
    async get(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const budget = await service.get(req.currentUser!.userId, res.locals['id'] as number);
        res.json({ budget });
      } catch (err) {
        next(err);
      }
    },

    async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const budget = await service.updateSettings(
          req.currentUser!.userId,
          res.locals['id'] as number,
          req.body as BudgetSettingsDto,
        );
        res.json({ budget });
      } catch (err) {
        next(err);
      }
    },

    async setRate(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const budget = await service.setRate(
          req.currentUser!.userId,
          res.locals['id'] as number,
          currencyParam(req),
          (req.body as { rate: number }).rate,
        );
        res.json({ budget });
      } catch (err) {
        next(err);
      }
    },

    async removeRate(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const budget = await service.removeRate(
          req.currentUser!.userId,
          res.locals['id'] as number,
          currencyParam(req),
        );
        res.json({ budget });
      } catch (err) {
        next(err);
      }
    },
  };
}
