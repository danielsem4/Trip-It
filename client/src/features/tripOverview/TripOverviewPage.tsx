import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BedDouble, Bus, CalendarClock, PlaneTakeoff, Wallet, type LucideIcon } from 'lucide-react'
import { TripOverviewShell, tripPath, useToday, useTrip } from '@/features/trips'
import { formatDay, formatDayTime, formatMoney, nightsBetween } from '@/features/tripItems'
import { flightRoute, useFlights } from '@/features/flights'
import { useStays } from '@/features/stays'
import { useTransport } from '@/features/transport'
import { sectionIcon, sectionSegment, useSectionsQuery, type Section } from '@/features/places'
import { BudgetBar, useBudgetQuery } from '@/features/budget'
import { TripMapCard } from '@/features/tripMap'
import { pickNextUp, type TripEvent } from './nextUp'

// The trip's home: its details plus one card per section, each linking to that section.
export function TripOverviewPage() {
  const trip = useTrip()
  const { t, i18n } = useTranslation('tripItems')
  const locale = i18n.resolvedLanguage ?? i18n.language
  const today = useToday()
  const flights = useFlights(trip.id).query.data
  const stays = useStays(trip.id).query.data
  const transport = useTransport(trip.id).query.data
  const sections = useSectionsQuery(trip.id).data
  const budget = useBudgetQuery(trip.id).data

  const events: TripEvent[] = [
    ...(flights ?? []).map((f) => ({
      kind: 'flight' as const,
      title: `${f.flightNumber} ${flightRoute(f)}`,
      date: f.departDate,
      time: f.departTime,
      segment: 'flights',
    })),
    ...(stays ?? []).flatMap((s) => [
      { kind: 'checkIn' as const, title: s.name, date: s.checkInDate, time: s.checkInTime, segment: 'stays' },
      { kind: 'checkOut' as const, title: s.name, date: s.checkOutDate, time: s.checkOutTime, segment: 'stays' },
    ]),
    ...(transport ?? []).map((x) => ({
      kind: 'transport' as const,
      title: x.title,
      date: x.date,
      time: x.time,
      segment: 'transport',
    })),
    ...(sections ?? []).flatMap((section) =>
      section.places
        .filter((p) => p.date && !p.done)
        .map((p) => ({
          kind: 'place' as const,
          title: p.name,
          date: p.date!,
          time: p.time,
          segment: sectionSegment(section),
        })),
    ),
  ]
  const next = pickNextUp(events, today)

  const nextFlight = flights?.find((f) => f.departDate >= today) ?? flights?.at(-1)
  const nextStay = stays?.find((s) => s.checkOutDate >= today) ?? stays?.at(-1)
  const nextTransport = transport?.find((x) => x.date >= today) ?? transport?.at(-1)

  // Same order as the sidebar: the built-in lists, transport, then the trip's own sections.
  const builtIn = (sections ?? []).filter((s) => s.kind !== 'CUSTOM')
  const custom = (sections ?? []).filter((s) => s.kind === 'CUSTOM')
  const renderSection = (section: Section) => {
    const done = section.places.filter((p) => p.done).length
    return (
      <OverviewCard
        key={section.id}
        to={tripPath(trip.id, sectionSegment(section))}
        icon={sectionIcon(section)}
        title={section.name ?? t(`${sectionSegment(section)}.title`)}
        userTitle={section.name !== null}
        count={section.places.length}
      >
        {section.places.length > 0 && (
          <Fact>{t('overview.visited', { done, count: section.places.length })}</Fact>
        )}
      </OverviewCard>
    )
  }

  return (
    <TripOverviewShell trip={trip}>
      {next && (
        <Link
          to={tripPath(trip.id, next.segment)}
          className="glass hover:bg-primary/10 focus-visible:ring-ring/50 flex items-start gap-3 rounded-xl p-4 outline-none transition focus-visible:ring-[3px]"
        >
          <CalendarClock className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {t('overview.nextUp')} · {t(`overview.event.${next.kind}`)}
            </span>
            <span className="font-semibold break-words">
              <bdi>{next.title}</bdi>
            </span>
            <span className="text-muted-foreground text-sm">{formatDayTime(next.date, next.time, locale)}</span>
          </div>
        </Link>
      )}

      <TripMapCard tripId={trip.id} stays={stays} sections={sections} transport={transport} />

      <nav aria-label={t('overview.sections')} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <OverviewCard to={tripPath(trip.id, 'flights')} icon={PlaneTakeoff} title={t('flights.title')} count={flights?.length}>
          {nextFlight && (
            <Fact user>
              {flightRoute(nextFlight)} · {formatDay(nextFlight.departDate, locale)}
            </Fact>
          )}
        </OverviewCard>

        <OverviewCard to={tripPath(trip.id, 'stays')} icon={BedDouble} title={t('stays.title')} count={stays?.length}>
          {nextStay && (
            <Fact user>
              {nextStay.name} ·{' '}
              {t('stays.nights', { count: nightsBetween(nextStay.checkInDate, nextStay.checkOutDate) })}
            </Fact>
          )}
        </OverviewCard>

        <OverviewCard to={tripPath(trip.id, 'budget')} icon={Wallet} title={t('budget.title')}>
          {budget && (
            <>
              <Fact>
                {formatMoney(budget.total, budget.currency, locale)}
                {budget.budgetAmount !== null && ` / ${formatMoney(budget.budgetAmount, budget.currency, locale)}`}
              </Fact>
              {budget.budgetAmount !== null && (
                <BudgetBar total={budget.total} budgetAmount={budget.budgetAmount} label={t('budget.title')} />
              )}
              {budget.unconverted.length > 0 && (
                <span className="text-destructive text-xs">{t('overview.missingRates')}</span>
              )}
            </>
          )}
        </OverviewCard>

        {builtIn.map(renderSection)}

        <OverviewCard to={tripPath(trip.id, 'transport')} icon={Bus} title={t('transport.title')} count={transport?.length}>
          {nextTransport && (
            <Fact user>
              {nextTransport.title} · {formatDay(nextTransport.date, locale)}
            </Fact>
          )}
        </OverviewCard>

        {custom.map(renderSection)}
      </nav>
    </TripOverviewShell>
  )
}

interface OverviewCardProps {
  to: string
  icon: LucideIcon
  title: string
  userTitle?: boolean
  count?: number
  // The section's key fact; "nothing yet" is shown when there is none.
  children?: ReactNode
}

function OverviewCard({ to, icon: Icon, title, userTitle, count, children }: Readonly<OverviewCardProps>) {
  const { t } = useTranslation('tripItems')
  return (
    <Link
      to={to}
      className="glass hover:bg-primary/10 focus-visible:ring-ring/50 flex min-h-24 min-w-0 flex-col gap-2 rounded-xl p-4 outline-none transition focus-visible:ring-[3px]"
    >
      <div className="flex items-center gap-2">
        <Icon className="text-primary size-5 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-medium">{userTitle ? <bdi>{title}</bdi> : title}</span>
        {!!count && <span className="text-muted-foreground shrink-0 text-sm font-semibold">{count}</span>}
      </div>
      {children || <span className="text-muted-foreground text-sm">{t('overview.nothingYet')}</span>}
    </Link>
  )
}

function Fact({ user, children }: Readonly<{ user?: boolean; children: ReactNode }>) {
  return (
    <span className="text-muted-foreground text-sm break-words">{user ? <bdi>{children}</bdi> : children}</span>
  )
}
