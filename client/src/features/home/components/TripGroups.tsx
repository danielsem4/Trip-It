import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TripCard, groupTrips } from '@/features/trips'
import type { Trip } from '@/features/trips'
import { cn } from '@/lib/utils'

interface TripGroupsProps {
  trips: Trip[]
  today: string
}

function Grid({ trips, today }: Readonly<TripGroupsProps>) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} today={today} />
      ))}
    </div>
  )
}

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export function TripGroups({ trips, today }: Readonly<TripGroupsProps>) {
  const { t } = useTranslation('home')
  const [pastOpen, setPastOpen] = useState(false)
  const groups = groupTrips(trips, today)

  return (
    <div className="flex flex-col gap-6">
      {groups.now.length > 0 && (
        <Section title={t('groups.now')}>
          <Grid trips={groups.now} today={today} />
        </Section>
      )}
      {groups.upcoming.length > 0 && (
        <Section title={t('groups.upcoming')}>
          <Grid trips={groups.upcoming} today={today} />
        </Section>
      )}
      {groups.past.length > 0 && (
        <section className="flex flex-col gap-3">
          <button
            type="button"
            aria-expanded={pastOpen}
            aria-controls="past-trips"
            onClick={() => setPastOpen((open) => !open)}
            className="focus-visible:ring-ring/50 flex min-h-10 w-fit items-center gap-2 rounded-md text-lg font-semibold outline-none focus-visible:ring-[3px]"
          >
            {t('groups.past', { count: groups.past.length })}
            <ChevronDown className={cn('size-5 transition-transform', pastOpen && 'rotate-180')} aria-hidden />
          </button>
          <div id="past-trips" hidden={!pastOpen}>
            {pastOpen && <Grid trips={groups.past} today={today} />}
          </div>
        </section>
      )}
    </div>
  )
}
