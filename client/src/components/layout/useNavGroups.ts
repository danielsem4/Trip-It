import { useMemo } from 'react'
import { useMatch } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import { parseTripId, TRIP_SECTIONS, tripPath, useTripQuery } from '@/features/trips'
import { homeItem, navItems, settingsItem, type NavGroup } from './navItems'

const globalGroups: NavGroup[] = [{ items: navItems }]

// The sidebar's content: the app-wide list, or the open trip's sections when inside a trip.
export function useNavGroups(): NavGroup[] {
  const tripId = parseTripId(useMatch('/trips/:id/*')?.params.id)
  const { data: trip } = useTripQuery(tripId ?? 0, tripId !== null)

  return useMemo(() => {
    if (!trip) return globalGroups
    return [
      { items: [homeItem] },
      {
        heading: trip.title,
        items: [
          {
            titleKey: 'nav.trip.overview',
            url: tripPath(trip.id),
            icon: LayoutDashboard,
            end: true,
          },
          ...TRIP_SECTIONS.map(({ key, titleKey, icon }) => ({
            titleKey,
            url: tripPath(trip.id, key),
            icon,
          })),
        ],
      },
      { items: [settingsItem] },
    ]
  }, [trip])
}
