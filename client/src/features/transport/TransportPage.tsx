import { useTranslation } from 'react-i18next'
import { Bus } from 'lucide-react'
import { useTrip } from '@/features/trips'
import { ItemSection } from '@/features/tripItems'
import { transportCard, transportFields } from './transport.config'
import { useTransport } from './useTransport'

export function TransportPage() {
  const trip = useTrip()
  const { t, i18n } = useTranslation('tripItems')
  const locale = i18n.resolvedLanguage ?? i18n.language
  const { api, query } = useTransport(trip.id)

  return (
    <ItemSection
      trip={trip}
      scope="transport"
      icon={Bus}
      items={query.data}
      isError={query.isError}
      onRetry={() => void query.refetch()}
      fields={transportFields}
      api={api}
      toCard={(item) => transportCard(item, t, locale)}
    />
  )
}
