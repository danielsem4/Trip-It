import { useMutation, useQuery } from '@tanstack/react-query'
import { tripItemKeys, useInvalidateTrip } from '@/features/tripItems'
import { getBudget, removeRate, setRate, updateBudgetSettings, type BudgetSettings } from './budget.api'

export function useBudgetQuery(tripId: number) {
  return useQuery({
    queryKey: tripItemKeys.collection(tripId, 'budget'),
    queryFn: ({ signal }) => getBudget(tripId, signal),
  })
}

// The main currency lives on the trip itself, so these refresh the whole trip too.
export function useUpdateBudgetSettings(tripId: number) {
  const invalidate = useInvalidateTrip(tripId)
  return useMutation({
    mutationFn: (data: BudgetSettings) => updateBudgetSettings(tripId, data),
    onSuccess: invalidate,
  })
}

export function useSetRate(tripId: number) {
  const invalidate = useInvalidateTrip(tripId)
  return useMutation({
    mutationFn: ({ currency, rate }: { currency: string; rate: number }) => setRate(tripId, currency, rate),
    onSuccess: invalidate,
  })
}

export function useRemoveRate(tripId: number) {
  const invalidate = useInvalidateTrip(tripId)
  return useMutation({
    mutationFn: (currency: string) => removeRate(tripId, currency),
    onSuccess: invalidate,
  })
}
