import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Trip } from '../types/trip.types'
import { formatTripDates } from '../lib/tripDates'
import { useTripCountdown } from '../hooks/useTripCountdown'
import { TripCover } from './TripCover'
import { MemberAvatars } from './MemberAvatars'

interface TripCardProps {
  trip: Trip
  today: string
}

export function TripCard({ trip, today }: Readonly<TripCardProps>) {
  const { t, i18n } = useTranslation('trips')
  const locale = i18n.resolvedLanguage ?? i18n.language

  const countdown = useTripCountdown(trip, today)

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="glass focus-visible:ring-ring/50 group flex flex-col overflow-hidden rounded-xl outline-none transition-transform focus-visible:ring-[3px] active:scale-[0.99] sm:hover:-translate-y-0.5"
    >
      <div className="h-24 w-full overflow-hidden">
        <TripCover trip={trip} className="transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-base font-semibold"><bdi>{trip.title}</bdi></h3>
          {trip.myRole !== 'OWNER' && (
            <span className="bg-secondary text-secondary-foreground shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
              {t(`card.role.${trip.myRole}`)}
            </span>
          )}
        </div>
        <p className="text-muted-foreground flex items-center gap-1 text-sm">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate"><bdi>{trip.destination}</bdi></span>
        </p>
        <p className="text-muted-foreground text-sm">{formatTripDates(trip, locale)}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <MemberAvatars members={trip.members} />
          {countdown && <span className="text-primary text-sm font-medium">{countdown}</span>}
        </div>
      </div>
    </Link>
  )
}
