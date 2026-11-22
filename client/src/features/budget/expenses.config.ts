import { CalendarDays } from 'lucide-react'
import { formatDay, type CardContent, type FieldDef } from '@/features/tripItems'

// A budget line that doesn't belong to any section (insurance, shopping, ...).
export interface Expense {
  id: number
  title: string
  date: string | null // 'YYYY-MM-DD'
  notes: string | null
  priceAmount: number
  priceCurrency: string
}

export const expenseFields: FieldDef[] = [
  { kind: 'text', name: 'title', required: true },
  { kind: 'price', required: true },
  { kind: 'date', name: 'date' },
  { kind: 'textarea', name: 'notes' },
]

export function expenseCard(expense: Expense, locale: string): CardContent {
  return {
    title: expense.title,
    lines: expense.date ? [{ icon: CalendarDays, text: formatDay(expense.date, locale) }] : [],
    notes: expense.notes,
    price: expense,
  }
}
