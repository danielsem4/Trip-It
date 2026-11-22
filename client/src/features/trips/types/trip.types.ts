export type TripRole = 'OWNER' | 'EDITOR' | 'VIEWER'
// What someone other than the owner can be.
export type GuestRole = Exclude<TripRole, 'OWNER'>

export type TripStatus = 'now' | 'upcoming' | 'past'

export interface TripMember {
  userId: number
  name: string | null
  email: string
  role: TripRole
}

export interface Trip {
  id: number
  title: string
  destination: string
  startDate: string // 'YYYY-MM-DD'
  endDate: string | null // 'YYYY-MM-DD'
  coverColor: string
  coverImageUrl: string | null
  currency: string // main currency, ISO 4217
  myRole: TripRole
  members: TripMember[] // owner first
}

// The trip's share link, as its owner sees it.
export interface TripInvite {
  token: string
  role: GuestRole
}

// What someone holding a share link sees before joining.
export interface InvitePreview {
  tripId: number
  title: string
  destination: string
  role: GuestRole
  invitedBy: string
  alreadyMember: boolean
}
