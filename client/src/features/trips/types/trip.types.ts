export type TripRole = 'OWNER' | 'EDITOR' | 'VIEWER'

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
  myRole: TripRole
  members: TripMember[] // owner first
}
