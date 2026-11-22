import { useMemo } from 'react'
import { itemApi, useTripItemsQuery } from '@/features/tripItems'
import type { Stay } from './stays.config'

export function useStays(tripId: number) {
  const api = useMemo(() => itemApi<Stay>(`/trips/${tripId}/stays`, 'stay', 'stays'), [tripId])
  const query = useTripItemsQuery(tripId, 'stays', api)
  return { api, query }
}
