import { describe, expect, it } from 'vitest'
import { pickNextUp, type TripEvent } from './nextUp'

const event = (title: string, date: string, time: string | null = null): TripEvent => ({
  kind: 'place',
  title,
  date,
  time,
  segment: 'attractions',
})

describe('pickNextUp', () => {
  it('returns null when nothing is planned from today on', () => {
    expect(pickNextUp([], '2027-05-12')).toBeNull()
    expect(pickNextUp([event('past', '2027-05-11')], '2027-05-12')).toBeNull()
  })

  it('picks the earliest event that is today or later', () => {
    const events = [event('later', '2027-05-14'), event('past', '2027-05-01'), event('today', '2027-05-12')]
    expect(pickNextUp(events, '2027-05-12')?.title).toBe('today')
  })

  it('orders same-day events by time, untimed last', () => {
    const events = [
      event('untimed', '2027-05-12'),
      event('evening', '2027-05-12', '20:00'),
      event('morning', '2027-05-12', '06:40'),
    ]
    expect(pickNextUp(events, '2027-05-12')?.title).toBe('morning')
    expect(pickNextUp(events.slice(0, 1), '2027-05-12')?.title).toBe('untimed')
  })
})
