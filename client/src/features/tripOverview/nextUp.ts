export interface TripEvent {
  // Translation key suffix under `overview.event` in `tripItems`.
  kind: 'flight' | 'checkIn' | 'checkOut' | 'transport' | 'place'
  title: string
  date: string // 'YYYY-MM-DD'
  time: string | null // 'HH:mm'
  // Path segment of the section it belongs to, under /trips/:id
  segment: string
}

// Untimed events sort after timed ones on the same day.
const sortKey = (e: TripEvent) => `${e.date} ${e.time ?? '99:99'}`

export function sortEvents(events: TripEvent[]): TripEvent[] {
  return [...events].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
}

// The first thing happening today or later.
export function pickNextUp(events: TripEvent[], today: string): TripEvent | null {
  return sortEvents(events).find((e) => e.date >= today) ?? null
}
