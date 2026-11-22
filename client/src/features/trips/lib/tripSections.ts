import {
  BedDouble,
  Bus,
  Landmark,
  PlaneTakeoff,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type TripSectionKey =
  | 'flights'
  | 'stays'
  | 'budget'
  | 'attractions'
  | 'restaurants'
  | 'transport'

export interface TripSectionDef {
  key: TripSectionKey // also the path segment under /trips/:id
  titleKey: string // `common` namespace
  icon: LucideIcon
}

// Built-in sections every trip has, in sidebar order.
export const TRIP_SECTIONS: TripSectionDef[] = [
  { key: 'flights', titleKey: 'nav.trip.flights', icon: PlaneTakeoff },
  { key: 'stays', titleKey: 'nav.trip.stays', icon: BedDouble },
  { key: 'budget', titleKey: 'nav.trip.budget', icon: Wallet },
  { key: 'attractions', titleKey: 'nav.trip.attractions', icon: Landmark },
  { key: 'restaurants', titleKey: 'nav.trip.restaurants', icon: Utensils },
  { key: 'transport', titleKey: 'nav.trip.transport', icon: Bus },
]

export const tripPath = (tripId: number, section?: string) =>
  section ? `/trips/${tripId}/${section}` : `/trips/${tripId}`
