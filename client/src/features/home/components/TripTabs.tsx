import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export type TripTab = 'mine' | 'shared'

interface TripTabsProps {
  value: TripTab
  onChange: (tab: TripTab) => void
}

const TABS: TripTab[] = ['mine', 'shared']

export function TripTabs({ value, onChange }: Readonly<TripTabsProps>) {
  const { t } = useTranslation('home')
  return (
    <div role="tablist" aria-label={t('tabs.label')} className="glass-subtle grid w-full grid-cols-2 gap-1 rounded-full border p-1 sm:w-fit">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={value === tab}
          onClick={() => onChange(tab)}
          className={cn(
            'focus-visible:ring-ring/50 h-10 rounded-full px-5 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px]',
            value === tab ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t(`tabs.${tab}`)}
        </button>
      ))}
    </div>
  )
}
