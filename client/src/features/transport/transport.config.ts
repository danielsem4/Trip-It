import { Building2, CalendarClock, Flag, Route, Ticket } from 'lucide-react'
import type { TFunction } from 'i18next'
import { formatDayTime, type CardContent, type FieldDef, type Price } from '@/features/tripItems'

export const TRANSPORT_TYPES = ['TRAIN', 'BUS', 'CAR_RENTAL', 'TAXI', 'FERRY', 'TRANSFER', 'OTHER'] as const

export interface Transport extends Price {
  id: number
  type: (typeof TRANSPORT_TYPES)[number]
  title: string
  fromPlace: string | null
  toPlace: string | null
  date: string // 'YYYY-MM-DD'
  time: string | null // 'HH:mm'
  endDate: string | null
  endTime: string | null
  provider: string | null
  confirmation: string | null
  notes: string | null
}

export const transportFields: FieldDef[] = [
  { kind: 'text', name: 'title', required: true },
  { kind: 'select', name: 'type', options: TRANSPORT_TYPES },
  { kind: 'text', name: 'fromPlace', half: true },
  { kind: 'text', name: 'toPlace', half: true },
  { kind: 'date', name: 'date', required: true, half: true },
  { kind: 'time', name: 'time', half: true },
  { kind: 'date', name: 'endDate', notBefore: 'date', half: true },
  { kind: 'time', name: 'endTime', half: true },
  { kind: 'text', name: 'provider', max: 100, half: true },
  { kind: 'text', name: 'confirmation', max: 100, half: true },
  { kind: 'price' },
  { kind: 'textarea', name: 'notes' },
]

export function transportCard(item: Transport, t: TFunction<'tripItems'>, locale: string): CardContent {
  const lines: CardContent['lines'] = [
    { icon: CalendarClock, text: formatDayTime(item.date, item.time, locale) },
  ]
  if (item.endDate || item.endTime) {
    lines.push({
      icon: Flag,
      text: t('transport.until', { when: formatDayTime(item.endDate ?? item.date, item.endTime, locale) }),
    })
  }
  if (item.fromPlace || item.toPlace) {
    lines.push({
      icon: Route,
      text: [item.fromPlace, item.toPlace].filter(Boolean).join(' → '),
      user: true,
    })
  }
  if (item.provider) lines.push({ icon: Building2, text: item.provider, user: true })
  if (item.confirmation) {
    lines.push({ icon: Ticket, text: t('common.confirmation', { value: item.confirmation }), user: true })
  }
  return {
    title: item.title,
    badge: t(`transport.options.type.${item.type}`),
    lines,
    notes: item.notes,
    price: item,
  }
}
