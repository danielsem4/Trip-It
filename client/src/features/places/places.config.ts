import {
  Baby,
  Beer,
  BookOpen,
  CakeSlice,
  CalendarClock,
  Camera,
  Coffee,
  Dumbbell,
  Gamepad2,
  Heart,
  Landmark,
  MapPin,
  Mountain,
  Music,
  ShoppingBag,
  Star,
  Store,
  Ticket,
  TreePalm,
  Trees,
  Utensils,
  Wine,
  type LucideIcon,
} from 'lucide-react'
import type { TFunction } from 'i18next'
import { formatDayTime, type CardContent, type FieldDef, type Price } from '@/features/tripItems'

export interface Place extends Price {
  id: number
  name: string
  address: string | null
  mapUrl: string | null
  date: string | null // 'YYYY-MM-DD'
  time: string | null // 'HH:mm'
  website: string | null
  notes: string | null
  done: boolean
  // Found by the server from the place's name; null while it's looking, or when there is none.
  photoUrl: string | null
}

export type SectionKind = 'ATTRACTIONS' | 'RESTAURANTS' | 'CUSTOM'

// A list of places: the two built-in ones, or one the user added to this trip.
export interface Section {
  id: number
  kind: SectionKind
  name: string | null // null for the built-in kinds
  icon: string | null
  places: Place[]
}

// Icon keys a custom section can use; must match the server's SECTION_ICONS.
export const SECTION_ICONS: Record<string, LucideIcon> = {
  pin: MapPin,
  star: Star,
  heart: Heart,
  coffee: Coffee,
  beer: Beer,
  wine: Wine,
  cake: CakeSlice,
  shopping: ShoppingBag,
  store: Store,
  music: Music,
  camera: Camera,
  museum: Landmark,
  tree: Trees,
  beach: TreePalm,
  mountain: Mountain,
  ticket: Ticket,
  gamepad: Gamepad2,
  dumbbell: Dumbbell,
  book: BookOpen,
  baby: Baby,
}

export function sectionIcon(section: Pick<Section, 'kind' | 'icon'>): LucideIcon {
  if (section.kind === 'ATTRACTIONS') return Landmark
  if (section.kind === 'RESTAURANTS') return Utensils
  return SECTION_ICONS[section.icon ?? ''] ?? MapPin
}

// Path segment under /trips/:id
export function sectionSegment(section: Pick<Section, 'kind' | 'id'>): string {
  if (section.kind === 'ATTRACTIONS') return 'attractions'
  if (section.kind === 'RESTAURANTS') return 'restaurants'
  return `sections/${section.id}`
}

// Translation scope inside `tripItems`.
export function sectionScope(kind: SectionKind): 'attractions' | 'restaurants' | 'places' {
  if (kind === 'ATTRACTIONS') return 'attractions'
  if (kind === 'RESTAURANTS') return 'restaurants'
  return 'places'
}

export const placeFields: FieldDef[] = [
  { kind: 'text', name: 'name', required: true },
  { kind: 'date', name: 'date', half: true },
  { kind: 'time', name: 'time', half: true },
  { kind: 'text', name: 'address', max: 300 },
  { kind: 'url', name: 'mapUrl' },
  { kind: 'url', name: 'website' },
  { kind: 'price' },
  { kind: 'textarea', name: 'notes' },
]

export function placeCard(place: Place, t: TFunction<'tripItems'>, locale: string): CardContent {
  const lines: CardContent['lines'] = []
  if (place.date) {
    lines.push({ icon: CalendarClock, text: formatDayTime(place.date, place.time, locale) })
  }
  if (place.address) lines.push({ icon: MapPin, text: place.address, user: true })

  const links: NonNullable<CardContent['links']> = []
  if (place.mapUrl) links.push({ label: t('common.map'), url: place.mapUrl })
  if (place.website) links.push({ label: t('common.website'), url: place.website })

  return { title: place.name, image: place.photoUrl, lines, links, notes: place.notes, price: place }
}
