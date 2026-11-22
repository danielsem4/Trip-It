import type { LucideIcon } from 'lucide-react'
import type { CardContent } from '@/features/tripItems'
import type { Stay } from '@/features/stays'
import type { Place, Section } from '@/features/places'
import type { Transport } from '@/features/transport'
import type { MapPoint } from './tripMap.api'

export type PinTone = 'stay' | 'attractions' | 'restaurants' | 'custom' | 'transport'

export interface MapPin {
  key: string
  lat: number
  lng: number
  tone: PinTone
  icon: LucideIcon
  title: string
  content: CardContent
  // Path segment under /trips/:id of the list this item lives in.
  segment: string
  // What to ask a maps app for directions to: the item's own address, or else the pin's coordinates.
  routeTo: string
}

export interface PinSources {
  stays: Stay[]
  sections: Section[]
  transport: Transport[]
}

// How each kind of item is drawn: the card builders its own list uses, and the icon for its pin.
export interface PinLooks {
  stay: (stay: Stay) => CardContent
  place: (place: Place) => CardContent
  transport: (item: Transport) => CardContent
  stayIcon: (stay: Stay) => LucideIcon
  // A place wears its section's icon.
  sectionIcon: (section: Section) => LucideIcon
  transportIcon: (item: Transport) => LucideIcon
}

const SECTION_TONE = { ATTRACTIONS: 'attractions', RESTAURANTS: 'restaurants', CUSTOM: 'custom' } as const

const sectionSegment = (section: Section) =>
  section.kind === 'CUSTOM' ? `sections/${section.id}` : SECTION_TONE[section.kind]

const routeTarget = (text: string | null | undefined, at: { lat: number; lng: number }) =>
  text?.trim() || `${at.lat},${at.lng}`

// Google Maps directions to a pin. With no origin given, it starts from wherever the device is.
export const directionsUrl = (routeTo: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(routeTo)}`

// Joins the located points with the trip's loaded items. A point whose item isn't loaded
// (deleted meanwhile, or still loading) is dropped.
export function buildPins(points: MapPoint[], sources: PinSources, looks: PinLooks): MapPin[] {
  const stays = new Map(sources.stays.map((s) => [s.id, s]))
  const transport = new Map(sources.transport.map((x) => [x.id, x]))
  const places = new Map(
    sources.sections.flatMap((section) => section.places.map((place) => [place.id, { place, section }] as const)),
  )

  return points.flatMap((point): MapPin[] => {
    const at = { lat: point.lat, lng: point.lng }
    if (point.kind === 'stay') {
      const stay = stays.get(point.itemId)
      if (!stay) return []
      return [
        {
          ...at,
          key: `stay-${stay.id}`,
          tone: 'stay',
          icon: looks.stayIcon(stay),
          title: stay.name,
          content: looks.stay(stay),
          segment: 'stays',
          routeTo: routeTarget(stay.address, at),
        },
      ]
    }
    if (point.kind === 'place') {
      const found = places.get(point.itemId)
      if (!found) return []
      const { place, section } = found
      return [
        {
          ...at,
          key: `place-${place.id}`,
          tone: SECTION_TONE[section.kind],
          icon: looks.sectionIcon(section),
          title: place.name,
          content: looks.place(place),
          segment: sectionSegment(section),
          routeTo: routeTarget(place.address, at),
        },
      ]
    }
    const item = transport.get(point.itemId)
    const end = point.end ?? 'from'
    if (!item) return []
    const where = end === 'from' ? item.fromPlace : item.toPlace
    return [
      {
        ...at,
        key: `transport-${item.id}-${end}`,
        tone: 'transport',
        icon: looks.transportIcon(item),
        title: where ? `${item.title} · ${where}` : item.title,
        content: looks.transport(item),
        segment: 'transport',
        routeTo: routeTarget(where, at),
      },
    ]
  })
}
