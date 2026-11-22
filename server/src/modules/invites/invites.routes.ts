import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/authenticate';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import type { TripAccess } from '../../shared/tripItems/tripItem.types';
import { inviteSchema } from './invites.schema';
import { InvitesRepository } from './invites.repository';
import { InvitesService } from './invites.service';
import { createInvitesController } from './invites.controller';

const repository = new InvitesRepository();

// Mounted at /api/trips/:id/invite: the owner's side of the trip's share link.
export function createTripInviteRouter(access: TripAccess): Router {
  const controller = createInvitesController(new InvitesService(repository, access));

  const router = Router({ mergeParams: true });
  router.get('/', controller.get);
  router.put('/', validateRequest(inviteSchema), controller.save);
  router.delete('/', controller.remove);
  return router;
}

// Mounted at /api/invites: what someone holding a link does with it. Membership isn't asked for here.
const noAccess: TripAccess = {
  requireRole: () => Promise.reject(new Error('invites by token do not check trip roles')),
};
const controller = createInvitesController(new InvitesService(repository, noAccess));

export const invitesRouter = Router();
invitesRouter.use(authenticate);
invitesRouter.get('/:token', controller.preview);
invitesRouter.post('/:token/accept', controller.accept);
