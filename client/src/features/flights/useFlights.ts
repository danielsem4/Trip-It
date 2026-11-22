import { useMemo } from 'react'
import { itemApi, useTripItemsQuery } from '@/features/tripItems'
import type { Flight } from './flights.config'

export function useFlights(tripId: number) {
  const api = useMemo(() => itemApi<Flight>(`/trips/${tripId}/flights`, 'flight', 'flights'), [tripId])
  const query = useTripItemsQuery(tripId, 'flights', api)
  return { api, query }
}
