import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acceptInvite,
  createTrip,
  deleteTrip,
  deleteTripInvite,
  getInvite,
  getTrip,
  getTripInvite,
  listTrips,
  removeMember,
  removeTripCover,
  saveTripInvite,
  setMemberRole,
  updateTrip,
  uploadTripCover,
} from '../api/trips.api'
import type { TripFormData } from '../schemas/trip.schema'
import type { GuestRole } from '../types/trip.types'

export const tripKeys = {
  all: ['trips'] as const,
  detail: (id: number) => ['trips', id] as const,
  invite: (id: number) => ['trips', id, 'invite'] as const,
}

export function useTripsQuery() {
  return useQuery({ queryKey: tripKeys.all, queryFn: ({ signal }) => listTrips(signal) })
}

export function useTripQuery(id: number, enabled = true) {
  return useQuery({
    enabled,
    // A 404 is a definitive answer (missing or not a member) -- don't retry it.
    retry: (count, error) =>
      !(axios.isAxiosError(error) && error.response?.status === 404) && count < 3,
    queryKey: tripKeys.detail(id),
    queryFn: ({ signal }) => getTrip(id, signal),
  })
}

function useInvalidateTrips() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: tripKeys.all })
}

export function useCreateTrip() {
  const invalidate = useInvalidateTrips()
  return useMutation({
    mutationFn: (data: TripFormData) => createTrip(data),
    onSuccess: invalidate,
  })
}

export function useUpdateTrip(id: number) {
  const invalidate = useInvalidateTrips()
  return useMutation({
    mutationFn: (data: Partial<TripFormData>) => updateTrip(id, data),
    onSuccess: invalidate,
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteTrip(id),
    onSuccess: async (_data, id) => {
      // Drop the detail query so it never refetches into a 404; refresh only the list.
      await queryClient.cancelQueries({ queryKey: tripKeys.detail(id) })
      queryClient.removeQueries({ queryKey: tripKeys.detail(id) })
      await queryClient.invalidateQueries({ queryKey: tripKeys.all, exact: true })
    },
  })
}

export function useUploadTripCover(id: number) {
  const invalidate = useInvalidateTrips()
  return useMutation({
    mutationFn: (file: File) => uploadTripCover(id, file),
    onSuccess: invalidate,
  })
}

export function useRemoveTripCover(id: number) {
  const invalidate = useInvalidateTrips()
  return useMutation({
    mutationFn: () => removeTripCover(id),
    onSuccess: invalidate,
  })
}

export function useSetMemberRole(id: number) {
  const invalidate = useInvalidateTrips()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: GuestRole }) => setMemberRole(id, userId, role),
    onSuccess: invalidate,
  })
}

export function useRemoveMember(id: number) {
  const invalidate = useInvalidateTrips()
  return useMutation({
    mutationFn: (userId: number) => removeMember(id, userId),
    onSuccess: invalidate,
  })
}

// Leaving is removing yourself: afterwards the trip is gone for you, like a deleted one.
export function useLeaveTrip(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => removeMember(id, userId),
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: tripKeys.detail(id) })
      queryClient.removeQueries({ queryKey: tripKeys.detail(id) })
      await queryClient.invalidateQueries({ queryKey: tripKeys.all, exact: true })
    },
  })
}

// The trip's share link; only its owner may ask.
export function useTripInviteQuery(id: number, enabled = true) {
  return useQuery({
    enabled,
    queryKey: tripKeys.invite(id),
    queryFn: ({ signal }) => getTripInvite(id, signal),
  })
}

export function useSaveTripInvite(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (role: GuestRole) => saveTripInvite(id, role),
    onSuccess: (invite) => queryClient.setQueryData(tripKeys.invite(id), invite),
  })
}

export function useDeleteTripInvite(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteTripInvite(id),
    onSuccess: () => queryClient.setQueryData(tripKeys.invite(id), null),
  })
}

export function useInviteQuery(token: string) {
  return useQuery({
    // A 404 is a definitive answer (the link was turned off) -- don't retry it.
    retry: (count, error) =>
      !(axios.isAxiosError(error) && error.response?.status === 404) && count < 3,
    queryKey: ['invites', token] as const,
    queryFn: ({ signal }) => getInvite(token, signal),
  })
}

export function useAcceptInvite(token: string) {
  const invalidate = useInvalidateTrips()
  return useMutation({
    mutationFn: () => acceptInvite(token),
    onSuccess: invalidate,
  })
}
