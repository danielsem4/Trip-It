import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTrip,
  deleteTrip,
  getTrip,
  listTrips,
  removeTripCover,
  updateTrip,
  uploadTripCover,
} from '../api/trips.api'
import type { TripFormData } from '../schemas/trip.schema'

export const tripKeys = {
  all: ['trips'] as const,
  detail: (id: number) => ['trips', id] as const,
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
