import { useTranslation } from 'react-i18next'
import type { Trip } from '../types/trip.types'
import { daysUntil, tripDayProgress, tripStatus } from '../lib/tripDates'

/** Localized countdown text for upcoming / in-progress trips; null for past trips. */
export function useTripCountdown(trip: Trip, today: string): string | null {
  const { t, i18n } = useTranslation('trips')
  const locale = i18n.resolvedLanguage ?? i18n.language
  const status = tripStatus(trip, today)

  if (status === 'upcoming') {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
      daysUntil(trip.startDate, today),
      'day',
    )
  }
  if (status === 'now') {
    const progress = tripDayProgress(trip, today)
    return progress ? t('card.dayOf', { day: progress.day, total: progress.total }) : t('card.today')
  }
  return null
}
