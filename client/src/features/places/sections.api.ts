import { apiClient } from '@/lib/apiClient'
import type { Place, Section } from './places.config'

export interface SectionFormData {
  name: string
  icon: string
}

export async function listSections(tripId: number, signal?: AbortSignal): Promise<Section[]> {
  const response = await apiClient.get<{ sections: Section[] }>(`/trips/${tripId}/sections`, { signal })
  return response.data.sections
}

export async function createSection(tripId: number, data: SectionFormData): Promise<Section> {
  const response = await apiClient.post<{ section: Section }>(`/trips/${tripId}/sections`, data)
  return response.data.section
}

export async function updateSection(tripId: number, id: number, data: SectionFormData): Promise<Section> {
  const response = await apiClient.put<{ section: Section }>(`/trips/${tripId}/sections/${id}`, data)
  return response.data.section
}

export async function deleteSection(tripId: number, id: number): Promise<void> {
  await apiClient.delete(`/trips/${tripId}/sections/${id}`)
}

export async function setPlaceDone(
  tripId: number,
  sectionId: number,
  placeId: number,
  done: boolean,
): Promise<Place> {
  const response = await apiClient.patch<{ place: Place }>(
    `/trips/${tripId}/sections/${sectionId}/places/${placeId}/done`,
    { done },
  )
  return response.data.place
}
