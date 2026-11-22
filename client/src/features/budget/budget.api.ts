import { apiClient } from '@/lib/apiClient'

export interface BudgetGroup {
  // 'flights' | 'stays' | 'transport' | 'expenses' | `section:${id}`
  key: string
  total: number // in the trip's main currency
  count: number
}

export interface Budget {
  currency: string // the trip's main currency
  budgetAmount: number | null
  // 1 unit of `currency` = `rate` units of the main currency
  rates: { currency: string; rate: number }[]
  groups: BudgetGroup[]
  total: number
  remaining: number | null // null when no budget is set
  // Prices in currencies that have no rate yet; they aren't part of the totals.
  unconverted: { currency: string; amount: number }[]
}

export interface BudgetSettings {
  currency: string
  budgetAmount: number | null
}

type BudgetResponse = { budget: Budget }

export async function getBudget(tripId: number, signal?: AbortSignal): Promise<Budget> {
  const response = await apiClient.get<BudgetResponse>(`/trips/${tripId}/budget`, { signal })
  return response.data.budget
}

export async function updateBudgetSettings(tripId: number, data: BudgetSettings): Promise<Budget> {
  const response = await apiClient.put<BudgetResponse>(`/trips/${tripId}/budget`, data)
  return response.data.budget
}

export async function setRate(tripId: number, currency: string, rate: number): Promise<Budget> {
  const response = await apiClient.put<BudgetResponse>(`/trips/${tripId}/budget/rates/${currency}`, { rate })
  return response.data.budget
}

export async function removeRate(tripId: number, currency: string): Promise<Budget> {
  const response = await apiClient.delete<BudgetResponse>(`/trips/${tripId}/budget/rates/${currency}`)
  return response.data.budget
}
