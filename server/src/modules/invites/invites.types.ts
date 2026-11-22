import type { GuestRole, TripRole } from '../trips/trips.types';

// The trip's share link.
export interface InviteShape {
  token: string;
  role: GuestRole;
}

export interface InviteRecord extends InviteShape {
  tripId: number;
  trip: {
    title: string;
    destination: string;
    members: { userId: number; role: TripRole; user: { name: string | null; email: string } }[];
  };
}

// What someone holding the link sees before joining.
export interface InvitePreview {
  tripId: number;
  title: string;
  destination: string;
  role: GuestRole;
  invitedBy: string;
  alreadyMember: boolean;
}

export interface IInvitesRepository {
  findByTrip(tripId: number): Promise<InviteShape | null>;
  findByToken(token: string): Promise<InviteRecord | null>;
  // Creates the trip's link with `token`, or only changes the role of the one it has.
  save(tripId: number, role: GuestRole, token: string): Promise<InviteShape>;
  delete(tripId: number): Promise<void>;
  // Does nothing for someone already on the trip.
  addMember(tripId: number, userId: number, role: GuestRole): Promise<void>;
}
