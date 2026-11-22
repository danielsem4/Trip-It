import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/authenticate';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { parseIdParam } from '../../shared/middlewares/parseIdParam';
import { createTripSchema, updateTripSchema } from './trips.schema';
import { TripsRepository } from './trips.repository';
import { TripsService } from './trips.service';
import { handleCoverUpload } from './trips.upload';
import { createTripsController } from './trips.controller';
import { createFlightsRouter } from '../flights/flights.routes';
import { createStaysRouter } from '../stays/stays.routes';
import { createTransportRouter } from '../transport/transport.routes';
import { createSectionsRouter } from '../sections/sections.routes';
import { createExpensesRouter } from '../expenses/expenses.routes';
import { createBudgetRouter } from '../budget/budget.routes';

const repository = new TripsRepository();
const service = new TripsService(repository);
const controller = createTripsController(service);

export const tripsRouter = Router();

tripsRouter.use(authenticate);
tripsRouter.get('/', controller.list);
tripsRouter.post('/', validateRequest(createTripSchema), controller.create);
tripsRouter.get('/:id', parseIdParam(), controller.get);
tripsRouter.patch('/:id', parseIdParam(), validateRequest(updateTripSchema), controller.update);
tripsRouter.delete('/:id', parseIdParam(), controller.remove);
tripsRouter.post('/:id/cover', parseIdParam(), handleCoverUpload, controller.setCover);
tripsRouter.delete('/:id/cover', parseIdParam(), controller.removeCover);

// What's inside a trip. Each router checks trip membership through the trips service.
tripsRouter.use('/:id/flights', parseIdParam(), createFlightsRouter(service));
tripsRouter.use('/:id/stays', parseIdParam(), createStaysRouter(service));
tripsRouter.use('/:id/transport', parseIdParam(), createTransportRouter(service));
tripsRouter.use('/:id/sections', parseIdParam(), createSectionsRouter(service));
tripsRouter.use('/:id/expenses', parseIdParam(), createExpensesRouter(service));
tripsRouter.use('/:id/budget', parseIdParam(), createBudgetRouter(service));
