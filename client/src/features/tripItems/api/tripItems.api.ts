import { apiClient } from '@/lib/apiClient'
import type { ItemPayload } from '../types/tripItem.types'

export interface ItemApi<T> {
  list(signal?: AbortSignal): Promise<T[]>
  create(data: ItemPayload): Promise<T>
  update(id: number, data: ItemPayload): Promise<T>
  remove(id: number): Promise<void>
}

// Client for one item collection, e.g. itemApi('/trips/7/flights', 'flight', 'flights').
// `one` and `many` are the response keys the server wraps items in.
export function itemApi<T>(basePath: string, one: string, many: string): ItemApi<T> {
  return {
    async list(signal) {
      const response = await apiClient.get<Record<string, T[]>>(basePath, { signal })
      return response.data[many]
    },
    async create(data) {
      const response = await apiClient.post<Record<string, T>>(basePath, data)
      return response.data[one]
    },
    async update(id, data) {
      const response = await apiClient.put<Record<string, T>>(`${basePath}/${id}`, data)
      return response.data[one]
    },
    async remove(id) {
      await apiClient.delete(`${basePath}/${id}`)
    },
  }
}
