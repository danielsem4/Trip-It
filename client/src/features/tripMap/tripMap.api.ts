import { apiClient } from '@/lib/apiClient'

export interface MapArea {
  lat: number
  lng: number
  // [south, north, west, east]
  bbox: [number, number, number, number] | null
}

export interface MapPoint {
  kind: 'stay' | 'place' | 'transport'
  itemId: number
  // Transport has a dot at each end.
  end?: 'from' | 'to'
  lat: number
  lng: number
}

export interface TripMap {
  // Where the trip's destination is; null until it has been located.
  area: MapArea | null
  points: MapPoint[]
  // Addresses the server is still looking up.
  pending: number
}

export async function getTripMap(tripId: number, signal?: AbortSignal): Promise<TripMap> {
  const response = await apiClient.get<{ map: TripMap }>(`/trips/${tripId}/map`, { signal })
  return response.data.map
}
