import { Link } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MemberAvatars, TripCover, formatTripDates, tripStatus, useTripCountdown } from '@/features/trips'
import type { Trip } from '@/features/trips'

interface HeroTripProps {
  trip: Trip
  today: string
}

export function HeroTrip({ trip, today }: Readonly<HeroTripProps>) {
  const { t, i18n } = useTranslation('home')
  const locale = i18n.resolvedLanguage ?? i18n.language
  const countdown = useTripCountdown(trip, today)
  const ongoing = tripStatus(trip, today) === 'now'

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="glass focus-visible:ring-ring/50 group relative flex min-h-48 flex-col justify-end overflow-hidden rounded-2xl outline-none focus-visible:ring-[3px] sm:min-h-56"
    >
      <div className="absolute inset-0">
        <TripCover trip={trip} className="transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" aria-hidden />
      <div className="relative flex flex-col gap-2 p-4 text-white sm:p-6">
        <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
          {ongoing ? t('hero.now') : t('hero.next')}
        </span>
        <h2 className="text-2xl font-bold break-words sm:text-3xl">
          <bdi>{trip.title}</bdi>
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90">
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className="size-4 shrink-0" aria-hidden />
            <bdi className="break-words">{trip.destination}</bdi>
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            {formatTripDates(trip, locale)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <MemberAvatars members={trip.members} />
          {countdown && <span className="text-lg font-semibold sm:text-xl">{countdown}</span>}
        </div>
      </div>
    </Link>
  )
}
