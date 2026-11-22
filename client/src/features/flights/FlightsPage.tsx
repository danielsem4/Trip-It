import { useTranslation } from 'react-i18next'
import { PlaneTakeoff } from 'lucide-react'
import { useTrip } from '@/features/trips'
import { ItemSection } from '@/features/tripItems'
import { flightCard, flightFields } from './flights.config'
import { useFlights } from './useFlights'

export function FlightsPage() {
  const trip = useTrip()
  const { t, i18n } = useTranslation('tripItems')
  const locale = i18n.resolvedLanguage ?? i18n.language
  const { api, query } = useFlights(trip.id)

  return (
    <ItemSection
      trip={trip}
      scope="flights"
      icon={PlaneTakeoff}
      items={query.data}
      isError={query.isError}
      onRetry={() => void query.refetch()}
      fields={flightFields}
      api={api}
      toCard={(item) => flightCard(item, t, locale)}
    />
  )
}
