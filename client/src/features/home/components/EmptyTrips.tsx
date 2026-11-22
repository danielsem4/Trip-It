import { Plus, Plane } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface EmptyTripsProps {
  onCreate: () => void
}

export function EmptyTrips({ onCreate }: Readonly<EmptyTripsProps>) {
  const { t } = useTranslation('home')
  return (
    <div className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center">
      <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
        <Plane className="size-7 rtl:-scale-x-100" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold">{t('empty.title')}</h2>
      <p className="text-muted-foreground max-w-sm text-balance">{t('empty.description')}</p>
      <Button onClick={onCreate} className="mt-2">
        <Plus aria-hidden />
        {t('empty.cta')}
      </Button>
    </div>
  )
}
