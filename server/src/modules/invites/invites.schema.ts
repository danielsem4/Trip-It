import { z } from 'zod';
import { guestRole } from '../trips/trips.schema';

export const inviteSchema = z.object({ role: guestRole });

export type InviteDto = z.infer<typeof inviteSchema>;
