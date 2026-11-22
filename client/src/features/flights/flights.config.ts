import { Armchair, DoorOpen, PlaneLanding, PlaneTakeoff, Ticket } from 'lucide-react'
import type { TFunction } from 'i18next'
import { formatDayTime, type CardContent, type FieldDef, type Price } from '@/features/tripItems'

export interface Flight extends Price {
  id: number
  airline: string | null
  flightNumber: string
  fromAirport: string
  toAirport: string
  departDate: string // 'YYYY-MM-DD'
  departTime: string | null // 'HH:mm'
  arriveDate: string | null
  arriveTime: string | null
  terminal: string | null
  confirmation: string | null
  seat: string | null
  notes: string | null
}

export const flightFields: FieldDef[] = [
  { kind: 'text', name: 'flightNumber', required: true, max: 20, half: true },
  { kind: 'text', name: 'airline', max: 100, half: true },
  { kind: 'text', name: 'fromAirport', required: true, max: 100, half: true },
  { kind: 'text', name: 'toAirport', required: true, max: 100, half: true },
  { kind: 'date', name: 'departDate', required: true, half: true },
  { kind: 'time', name: 'departTime', half: true },
  { kind: 'date', name: 'arriveDate', notBefore: 'departDate', half: true },
  { kind: 'time', name: 'arriveTime', half: true },
  { kind: 'text', name: 'terminal', max: 50, half: true },
  { kind: 'text', name: 'seat', max: 50, half: true },
  { kind: 'text', name: 'confirmation', max: 100 },
  { kind: 'price' },
  { kind: 'textarea', name: 'notes' },
]

// ⁦..⁩ keeps "TLV -> AMS" reading left to right inside Hebrew text.
export const flightRoute = (flight: Pick<Flight, 'fromAirport' | 'toAirport'>) =>
  `⁦${flight.fromAirport} → ${flight.toAirport}⁩`

export function flightCard(flight: Flight, t: TFunction<'tripItems'>, locale: string): CardContent {
  const lines: CardContent['lines'] = [
    {
      icon: PlaneTakeoff,
      text: t('flights.departs', { when: formatDayTime(flight.departDate, flight.departTime, locale) }),
    },
  ]
  if (flight.arriveDate || flight.arriveTime) {
    lines.push({
      icon: PlaneLanding,
      text: t('flights.arrives', {
        when: formatDayTime(flight.arriveDate ?? flight.departDate, flight.arriveTime, locale),
      }),
    })
  }
  if (flight.terminal) {
    lines.push({ icon: DoorOpen, text: t('flights.terminal', { value: flight.terminal }), user: true })
  }
  if (flight.seat) lines.push({ icon: Armchair, text: t('flights.seat', { value: flight.seat }), user: true })
  if (flight.confirmation) {
    lines.push({ icon: Ticket, text: t('common.confirmation', { value: flight.confirmation }), user: true })
  }
  return {
    title: flightRoute(flight),
    badge: [flight.airline, flight.flightNumber].filter(Boolean).join(' '),
    lines,
    notes: flight.notes,
    price: flight,
  }
}
