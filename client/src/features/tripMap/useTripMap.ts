import { useQuery } from '@tanstack/react-query'
import { tripItemKeys } from '@/features/tripItems'
import { getTripMap } from './tripMap.api'

const POLL_MS = 2500

// Lives under the trip's key, so any change inside the trip refreshes it.
// While addresses are still being looked up it asks again, and dots appear as they're found.
export function useTripMapQuery(tripId: number) {
  return useQuery({
    queryKey: tripItemKeys.collection(tripId, 'map'),
    queryFn: ({ signal }) => getTripMap(tripId, signal),
    refetchInterval: (query) => (query.state.data?.pending ? POLL_MS : false),
  })
}
