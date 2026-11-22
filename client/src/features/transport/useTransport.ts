import { useMemo } from 'react'
import { itemApi, useTripItemsQuery } from '@/features/tripItems'
import type { Transport } from './transport.config'

export function useTransport(tripId: number) {
  const api = useMemo(() => itemApi<Transport>(`/trips/${tripId}/transport`, 'transport', 'transports'), [tripId])
  const query = useTripItemsQuery(tripId, 'transport', api)
  return { api, query }
}
