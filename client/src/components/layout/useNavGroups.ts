import { useMemo } from 'react'
import { useMatch } from 'react-router-dom'
import { LayoutDashboard, Plus } from 'lucide-react'
import { canEditTrip, parseTripId, TRIP_SECTIONS, tripPath, useTripQuery } from '@/features/trips'
import { sectionIcon, sectionSegment, useSectionsQuery } from '@/features/places'
import { homeItem, navItems, settingsItem, type NavGroup, type NavItem } from './navItems'

const globalGroups: NavGroup[] = [{ items: navItems }]

// The sidebar's content: the app-wide list, or the open trip's sections when inside a trip.
export function useNavGroups(): NavGroup[] {
  const tripId = parseTripId(useMatch('/trips/:id/*')?.params.id)
  const { data: trip } = useTripQuery(tripId ?? 0, tripId !== null)
  const { data: sections } = useSectionsQuery(trip?.id ?? 0, trip !== undefined)

  return useMemo(() => {
    if (!trip) return globalGroups

    // The sections the user added to this trip, then the way to add another.
    const custom: NavItem[] = (sections ?? [])
      .filter((section) => section.kind === 'CUSTOM')
      .map((section) => ({
        title: section.name ?? '',
        url: tripPath(trip.id, sectionSegment(section)),
        icon: sectionIcon(section),
      }))
    if (canEditTrip(trip)) {
      custom.push({ titleKey: 'nav.trip.addSection', url: tripPath(trip.id, 'sections/new'), icon: Plus })
    }

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
          ...custom,
        ],
      },
      { items: [settingsItem] },
    ]
  }, [trip, sections])
}
