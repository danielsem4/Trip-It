import { cn } from '@/lib/utils'

interface BudgetBarProps {
  total: number
  budgetAmount: number
  label: string
}

export function BudgetBar({ total, budgetAmount, label }: Readonly<BudgetBarProps>) {
  const over = total > budgetAmount
  const percent = budgetAmount > 0 ? Math.min(100, Math.round((total / budgetAmount) * 100)) : over ? 100 : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="bg-muted-foreground/15 h-2.5 w-full overflow-hidden rounded-full"
    >
      <div
        className={cn('h-full rounded-full transition-[width]', over ? 'bg-destructive' : 'bg-primary')}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
