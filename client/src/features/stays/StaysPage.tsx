import { useTranslation } from 'react-i18next'
import { BedDouble } from 'lucide-react'
import { useTrip } from '@/features/trips'
import { ItemSection } from '@/features/tripItems'
import { stayCard, stayFields } from './stays.config'
import { useStays } from './useStays'

export function StaysPage() {
  const trip = useTrip()
  const { t, i18n } = useTranslation('tripItems')
  const locale = i18n.resolvedLanguage ?? i18n.language
  const { api, query } = useStays(trip.id)

  return (
    <ItemSection
      trip={trip}
      scope="stays"
      icon={BedDouble}
      items={query.data}
      isError={query.isError}
      onRetry={() => void query.refetch()}
      fields={stayFields}
      api={api}
      toCard={(item) => stayCard(item, t, locale)}
    />
  )
}
