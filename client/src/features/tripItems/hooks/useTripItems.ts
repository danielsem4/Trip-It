import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tripKeys } from '@/features/trips'
import type { ItemApi } from '../api/tripItems.api'
import type { ItemPayload } from '../types/tripItem.types'

// Everything inside a trip is cached under ['trips', id, <collection>].
export const tripItemKeys = {
  collection: (tripId: number, name: string) => [...tripKeys.detail(tripId), name] as const,
}

export function useTripItemsQuery<T>(tripId: number, name: string, api: ItemApi<T>) {
  return useQuery({
    queryKey: tripItemKeys.collection(tripId, name),
    queryFn: ({ signal }) => api.list(signal),
  })
}

// Any change inside a trip can move its budget and overview, so refresh the whole trip.
export function useInvalidateTrip(tripId: number) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) })
}

export function useSaveTripItem<T>(tripId: number, api: Pick<ItemApi<T>, 'create' | 'update'>) {
  const invalidate = useInvalidateTrip(tripId)
  return useMutation({
    mutationFn: ({ id, data }: { id: number | null; data: ItemPayload }) =>
      id === null ? api.create(data) : api.update(id, data),
    onSuccess: invalidate,
  })
}

export function useDeleteTripItem<T>(tripId: number, api: Pick<ItemApi<T>, 'remove'>) {
  const invalidate = useInvalidateTrip(tripId)
  return useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: invalidate,
  })
}
