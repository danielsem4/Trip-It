import { BedDouble, CalendarCheck, CalendarX, Hotel, House, MapPin, Phone, Ticket, type LucideIcon } from 'lucide-react'
import type { TFunction } from 'i18next'
import {
  formatDayTime,
  nightsBetween,
  type CardContent,
  type FieldDef,
  type Price,
} from '@/features/tripItems'

export const STAY_TYPES = ['HOTEL', 'APARTMENT', 'OTHER'] as const

export interface Stay extends Price {
  id: number
  type: (typeof STAY_TYPES)[number]
  name: string
  address: string | null
  mapUrl: string | null
  checkInDate: string // 'YYYY-MM-DD'
  checkInTime: string | null // 'HH:mm'
  checkOutDate: string
  checkOutTime: string | null
  confirmation: string | null
  website: string | null
  phone: string | null
  notes: string | null
}

const STAY_ICONS: Record<Stay['type'], LucideIcon> = { HOTEL: Hotel, APARTMENT: House, OTHER: BedDouble }

export function stayIcon(type: Stay['type']): LucideIcon {
  return STAY_ICONS[type] ?? BedDouble
}

export const stayFields: FieldDef[] = [
  { kind: 'text', name: 'name', required: true },
  { kind: 'select', name: 'type', options: STAY_TYPES },
  { kind: 'date', name: 'checkInDate', required: true, half: true },
  { kind: 'time', name: 'checkInTime', half: true },
  { kind: 'date', name: 'checkOutDate', required: true, notBefore: 'checkInDate', half: true },
  { kind: 'time', name: 'checkOutTime', half: true },
  { kind: 'text', name: 'address', max: 300 },
  { kind: 'url', name: 'mapUrl' },
  { kind: 'url', name: 'website' },
  { kind: 'text', name: 'phone', max: 50, half: true },
  { kind: 'text', name: 'confirmation', max: 100, half: true },
  { kind: 'price' },
  { kind: 'textarea', name: 'notes' },
]

export function stayCard(stay: Stay, t: TFunction<'tripItems'>, locale: string): CardContent {
  const lines: CardContent['lines'] = [
    {
      icon: CalendarCheck,
      text: t('stays.checkIn', { when: formatDayTime(stay.checkInDate, stay.checkInTime, locale) }),
    },
    {
      icon: CalendarX,
      text: t('stays.checkOut', { when: formatDayTime(stay.checkOutDate, stay.checkOutTime, locale) }),
    },
  ]
  if (stay.address) lines.push({ icon: MapPin, text: stay.address, user: true })
  if (stay.phone) lines.push({ icon: Phone, text: `⁦${stay.phone}⁩` })
  if (stay.confirmation) {
    lines.push({ icon: Ticket, text: t('common.confirmation', { value: stay.confirmation }), user: true })
  }

  const links: NonNullable<CardContent['links']> = []
  if (stay.mapUrl) links.push({ label: t('common.map'), url: stay.mapUrl })
  if (stay.website) links.push({ label: t('common.website'), url: stay.website })

  const nights = nightsBetween(stay.checkInDate, stay.checkOutDate)
  return {
    title: stay.name,
    badge: nights > 0 ? t('stays.nights', { count: nights }) : t(`stays.options.type.${stay.type}`),
    lines,
    links,
    notes: stay.notes,
    price: stay,
  }
}
