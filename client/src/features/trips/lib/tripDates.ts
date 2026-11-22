import type { Trip, TripStatus } from '../types/trip.types'

const MS_PER_DAY = 86_400_000

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number)
  return [y as number, m as number, d as number]
}

function utcDay(iso: string): number {
  const [y, m, d] = parts(iso)
  return Date.UTC(y, m - 1, d)
}

function diffDays(from: string, to: string): number {
  return Math.round((utcDay(to) - utcDay(from)) / MS_PER_DAY)
}

export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function tripStatus(trip: Trip, today: string): TripStatus {
  const end = trip.endDate ?? trip.startDate
  if (trip.startDate > today) return 'upcoming'
  if (end < today) return 'past'
  return 'now'
}

export function groupTrips(trips: Trip[], today: string): Record<TripStatus, Trip[]> {
  const groups: Record<TripStatus, Trip[]> = { now: [], upcoming: [], past: [] }
  for (const trip of trips) groups[tripStatus(trip, today)].push(trip)
  const asc = (a: Trip, b: Trip) => a.startDate.localeCompare(b.startDate)
  groups.now.sort(asc)
  groups.upcoming.sort(asc)
  groups.past.sort((a, b) => asc(b, a))
  return groups
}

export function pickHeroTrip(trips: Trip[], today: string): Trip | null {
  const groups = groupTrips(trips, today)
  return groups.now[0] ?? groups.upcoming[0] ?? null
}

export function daysUntil(startDate: string, today: string): number {
  return diffDays(today, startDate)
}

export function tripDayProgress(
  trip: Trip,
  today: string,
): { day: number; total: number } | null {
  if (!trip.endDate) return null
  return {
    day: diffDays(trip.startDate, today) + 1,
    total: diffDays(trip.startDate, trip.endDate) + 1,
  }
}

export function formatTripDates(trip: Trip, locale: string): string {
  const toDate = (iso: string) => {
    const [y, m, d] = parts(iso)
    return new Date(y, m - 1, d)
  }
  const start = toDate(trip.startDate)
  const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, opts)
  if (!trip.endDate) {
    return fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(start)
  }
  const end = toDate(trip.endDate)
  const sameYear = start.getFullYear() === end.getFullYear()
  const startFmt = fmt(
    sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' },
  )
  const endFmt = fmt({ day: 'numeric', month: 'short', year: 'numeric' })
  return `${startFmt.format(start)} – ${endFmt.format(end)}`
}
