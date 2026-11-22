import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface EmptyTripsProps {
  onCreate: () => void
}

// One full row per breakpoint: 1 card on phones, 2 at sm, 3 at xl.
const PLACEHOLDER_VISIBILITY = ['flex', 'hidden sm:flex', 'hidden xl:flex']

export function EmptyTrips({ onCreate }: Readonly<EmptyTripsProps>) {
  const { t } = useTranslation('home')
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">{t('empty.title')}</h2>
        <p className="text-muted-foreground text-balance">{t('empty.description')}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PLACEHOLDER_VISIBILITY.map((visibility, i) => {
          const primary = i === 0
          return (
            <button
              key={i}
              type="button"
              onClick={onCreate}
              aria-label={primary ? t('empty.cta') : undefined}
              aria-hidden={primary ? undefined : true}
              tabIndex={primary ? undefined : -1}
              className={cn(
                visibility,
                'border-primary/30 bg-primary/5 hover:border-primary/60 hover:bg-primary/10 focus-visible:ring-ring/50 group flex-col overflow-hidden rounded-xl border-2 border-dashed text-start outline-none transition-[transform,background-color,border-color] focus-visible:ring-[3px] active:scale-[0.99]',
                !primary && 'opacity-60',
              )}
            >
              <div className="flex h-24 w-full items-center justify-center">
                <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full transition-transform group-hover:scale-110">
                  <Plus className="size-6" aria-hidden />
                </div>
              </div>
              <div className="flex flex-col gap-2 p-4">
                {primary && <span className="text-primary font-medium">{t('empty.cta')}</span>}
                <div className="bg-muted-foreground/15 h-3 w-2/3 rounded-full" />
                <div className="bg-muted-foreground/15 h-3 w-1/2 rounded-full" />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
