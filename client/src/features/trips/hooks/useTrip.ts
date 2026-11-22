import { useOutletContext } from 'react-router-dom'
import type { Trip } from '../types/trip.types'

// The trip loaded by TripLayout; only valid in pages routed under /trips/:id.
export function useTrip(): Trip {
  return useOutletContext<Trip>()
}

export function canEditTrip(trip: Trip): boolean {
  return trip.myRole === 'OWNER' || trip.myRole === 'EDITOR'
}
