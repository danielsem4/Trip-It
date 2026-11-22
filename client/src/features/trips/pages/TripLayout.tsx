import { Outlet, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { NotFoundPage } from '@/components/shared/NotFoundPage'
import { useTripQuery } from '../hooks/useTrips'
import { parseTripId } from '../lib/tripId'
import type { Trip } from '../types/trip.types'

// Loads the trip once for every page under /trips/:id and hands it down via useTrip().
export function TripLayout() {
  const { id: rawId } = useParams()
  const id = parseTripId(rawId)
  const { t } = useTranslation('trips')
  const query = useTripQuery(id ?? 0, id !== null)

  if (id === null) return <NotFoundPage />
  if (query.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner className="text-primary size-8" aria-label={t('details.loading')} />
      </div>
    )
  }
  if (query.isError) {
    if (axios.isAxiosError(query.error) && query.error.response?.status === 404) {
      return <NotFoundPage />
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-muted-foreground">{t('details.loadFailed')}</p>
        <Button onClick={() => void query.refetch()} disabled={query.isFetching}>
          {t('details.retry')}
        </Button>
      </div>
    )
  }
  return <Outlet context={query.data satisfies Trip} />
}
