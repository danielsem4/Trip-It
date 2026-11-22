import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/authenticate';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { parseIdParam } from '../../shared/middlewares/parseIdParam';
import { createTripSchema, updateTripSchema } from './trips.schema';
import { TripsRepository } from './trips.repository';
import { TripsService } from './trips.service';
import { createTripsController } from './trips.controller';

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
