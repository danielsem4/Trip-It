import { Router } from 'express';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import type { TripAccess } from '../../shared/tripItems/tripItem.types';
import { budgetSettingsSchema, rateSchema } from './budget.schema';
import { BudgetRepository } from './budget.repository';
import { BudgetService } from './budget.service';
import { createBudgetController } from './budget.controller';

// Mounted at /api/trips/:id/budget
export function createBudgetRouter(access: TripAccess): Router {
  const controller = createBudgetController(new BudgetService(new BudgetRepository(), access));

  const router = Router({ mergeParams: true });
  router.get('/', controller.get);
  router.put('/', validateRequest(budgetSettingsSchema), controller.updateSettings);
  router.put('/rates/:currency', validateRequest(rateSchema), controller.setRate);
  router.delete('/rates/:currency', controller.removeRate);
  return router;
}
