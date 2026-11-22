import { useMutation, useQuery } from '@tanstack/react-query'
import { tripItemKeys, useInvalidateTrip } from '@/features/tripItems'
import {
  createSection,
  deleteSection,
  listSections,
  setPlaceDone,
  updateSection,
  type SectionFormData,
} from './sections.api'

// All of a trip's place sections with their places, in one query.
export function useSectionsQuery(tripId: number, enabled = true) {
  return useQuery({
    enabled,
    queryKey: tripItemKeys.collection(tripId, 'sections'),
    queryFn: ({ signal }) => listSections(tripId, signal),
  })
}

export function useSaveSection(tripId: number) {
  const invalidate = useInvalidateTrip(tripId)
  return useMutation({
    mutationFn: ({ id, data }: { id: number | null; data: SectionFormData }) =>
      id === null ? createSection(tripId, data) : updateSection(tripId, id, data),
    onSuccess: invalidate,
  })
}

export function useDeleteSection(tripId: number) {
  const invalidate = useInvalidateTrip(tripId)
  return useMutation({
    mutationFn: (id: number) => deleteSection(tripId, id),
    // Not awaited: the caller leaves the section's page before the refetch lands.
    onSuccess: () => void invalidate(),
  })
}

export function useSetPlaceDone(tripId: number, sectionId: number) {
  const invalidate = useInvalidateTrip(tripId)
  return useMutation({
    mutationFn: ({ placeId, done }: { placeId: number; done: boolean }) =>
      setPlaceDone(tripId, sectionId, placeId, done),
    onSuccess: invalidate,
  })
}
