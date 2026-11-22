import { apiClient } from '@/lib/apiClient'
import type { GuestRole, InvitePreview, Trip, TripInvite } from '../types/trip.types'
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

export async function setMemberRole(id: number, userId: number, role: GuestRole): Promise<Trip> {
  const response = await apiClient.patch<{ trip: Trip }>(`/trips/${id}/members/${userId}`, { role })
  return response.data.trip
}

// Removing yourself is leaving the trip.
export async function removeMember(id: number, userId: number): Promise<void> {
  await apiClient.delete(`/trips/${id}/members/${userId}`)
}

export async function getTripInvite(id: number, signal?: AbortSignal): Promise<TripInvite | null> {
  const response = await apiClient.get<{ invite: TripInvite | null }>(`/trips/${id}/invite`, { signal })
  return response.data.invite
}

// Creates the trip's share link, or changes the role of the one it has.
export async function saveTripInvite(id: number, role: GuestRole): Promise<TripInvite> {
  const response = await apiClient.put<{ invite: TripInvite }>(`/trips/${id}/invite`, { role })
  return response.data.invite
}

export async function deleteTripInvite(id: number): Promise<void> {
  await apiClient.delete(`/trips/${id}/invite`)
}

export async function getInvite(token: string, signal?: AbortSignal): Promise<InvitePreview> {
  const response = await apiClient.get<{ invite: InvitePreview }>(`/invites/${token}`, { signal })
  return response.data.invite
}

export async function acceptInvite(token: string): Promise<number> {
  const response = await apiClient.post<{ tripId: number }>(`/invites/${token}/accept`)
  return response.data.tripId
}
