import { apiClient } from '@/lib/apiClient'
import type { Trip } from '../types/trip.types'
import type { TripFormData } from '../schemas/trip.schema'

export async function listTrips(signal?: AbortSignal): Promise<Trip[]> {
  const response = await apiClient.get<{ trips: Trip[] }>('/trips', { signal })
  return response.data.trips
}

export async function getTrip(id: number, signal?: AbortSignal): Promise<Trip> {
  const response = await apiClient.get<{ trip: Trip }>(`/trips/${id}`, { signal })
  return response.data.trip
}

export async function createTrip(data: TripFormData): Promise<Trip> {
  const response = await apiClient.post<{ trip: Trip }>('/trips', data)
  return response.data.trip
}

export async function updateTrip(id: number, data: Partial<TripFormData>): Promise<Trip> {
  const response = await apiClient.patch<{ trip: Trip }>(`/trips/${id}`, data)
  return response.data.trip
}

export async function deleteTrip(id: number): Promise<void> {
  await apiClient.delete(`/trips/${id}`)
}

export async function uploadTripCover(id: number, file: File): Promise<Trip> {
  const form = new FormData()
  form.append('cover', file)
  const response = await apiClient.post<{ trip: Trip }>(`/trips/${id}/cover`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.trip
}

export async function removeTripCover(id: number): Promise<Trip> {
  const response = await apiClient.delete<{ trip: Trip }>(`/trips/${id}/cover`)
  return response.data.trip
}
