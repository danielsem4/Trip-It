import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { TripFormDialog, pickHeroTrip, todayISO, useTripsQuery } from '@/features/trips'
import { Button } from '@/components/ui/button'
import { HeroTrip } from '../components/HeroTrip'
import { TripTabs, type TripTab } from '../components/TripTabs'
import { TripGroups } from '../components/TripGroups'
import { EmptyTrips } from '../components/EmptyTrips'
import { CreateTripFab } from '../components/CreateTripFab'

function TripSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass h-56 animate-pulse rounded-xl" />
      ))}
    </div>
  )
}

export function HomePage() {
  const { t } = useTranslation('home')
  const { user } = useAuth()
  const query = useTripsQuery()
  const [params, setParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [today] = useState(() => todayISO())
  const tab: TripTab = params.get('tab') === 'shared' ? 'shared' : 'mine'

  function changeTab(next: TripTab) {
    setParams(next === 'mine' ? {} : { tab: next }, { replace: true })
  }

  const trips = query.data
  const hero = trips ? pickHeroTrip(trips, today) : null
  const tabTrips = trips?.filter((trip) => (tab === 'mine') === (trip.myRole === 'OWNER')) ?? []

  let content
  if (query.isPending) {
    content = <TripSkeletons />
  } else if (query.isError) {
    content = (
      <div className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-10 text-center">
        <p className="text-muted-foreground">{t('loadFailed')}</p>
        <Button onClick={() => void query.refetch()} disabled={query.isFetching}>
          {t('retry')}
        </Button>
      </div>
    )
  } else if (query.data.length === 0) {
    content = <EmptyTrips onCreate={() => setCreateOpen(true)} />
  } else {
    content = (
      <>
        <TripTabs value={tab} onChange={changeTab} />
        {tabTrips.length > 0 ? (
          <TripGroups trips={tabTrips} today={today} />
        ) : tab === 'shared' ? (
          <p className="text-muted-foreground py-8 text-center">{t('sharedEmpty')}</p>
        ) : (
          <EmptyTrips onCreate={() => setCreateOpen(true)} />
        )}
      </>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pb-24 sm:gap-6 md:pb-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-balance sm:text-3xl">
            {t('welcome', { name: `\u2068${user?.name ?? user?.email}\u2069` })}
          </h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button className="hidden md:inline-flex" onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden />
          {t('newTrip')}
        </Button>
      </div>
      {hero && <HeroTrip trip={hero} today={today} />}
      {content}
      <CreateTripFab onClick={() => setCreateOpen(true)} />
      <TripFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
