import { describe, expect, it } from 'vitest'
import type { Trip } from '../types/trip.types'
import {
  daysUntil,
  groupTrips,
  pickHeroTrip,
  todayISO,
  tripDayProgress,
  tripStatus,
} from './tripDates'

function makeTrip(id: number, startDate: string, endDate: string | null): Trip {
  return {
    id,
    title: `Trip ${id}`,
    destination: 'Somewhere',
    startDate,
    endDate,
    coverColor: 'sky',
    coverImageUrl: null,
    myRole: 'OWNER',
    members: [],
  }
}

const TODAY = '2026-03-10'

describe('tripDates', () => {
  it('todayISO uses local date', () => {
    expect(todayISO(new Date(2026, 2, 1, 23, 30))).toBe('2026-03-01')
  })

  it('trip starting today is now', () => {
    expect(tripStatus(makeTrip(1, TODAY, '2026-03-15'), TODAY)).toBe('now')
  })

  it('trip ending today is now', () => {
    expect(tripStatus(makeTrip(1, '2026-03-05', TODAY), TODAY)).toBe('now')
  })

  it('trip ended yesterday is past', () => {
    expect(tripStatus(makeTrip(1, '2026-03-05', '2026-03-09'), TODAY)).toBe('past')
  })

  it('trip starting tomorrow is upcoming', () => {
    expect(tripStatus(makeTrip(1, '2026-03-11', null), TODAY)).toBe('upcoming')
  })

  it('no end date: now on start day, past the day after', () => {
    expect(tripStatus(makeTrip(1, TODAY, null), TODAY)).toBe('now')
    expect(tripStatus(makeTrip(1, '2026-03-09', null), TODAY)).toBe('past')
  })

  it('groupTrips sorts upcoming asc and past desc', () => {
    const trips = [
      makeTrip(1, '2026-05-01', null),
      makeTrip(2, '2026-04-01', null),
      makeTrip(3, '2026-01-01', '2026-01-05'),
      makeTrip(4, '2026-02-01', '2026-02-05'),
      makeTrip(5, '2026-03-08', '2026-03-12'),
    ]
    const g = groupTrips(trips, TODAY)
    expect(g.now.map((t) => t.id)).toEqual([5])
    expect(g.upcoming.map((t) => t.id)).toEqual([2, 1])
    expect(g.past.map((t) => t.id)).toEqual([4, 3])
  })

  it('pickHeroTrip prefers now over upcoming, null when only past', () => {
    const now = makeTrip(1, '2026-03-08', '2026-03-12')
    const soon = makeTrip(2, '2026-03-11', null)
    const past = makeTrip(3, '2026-01-01', '2026-01-02')
    expect(pickHeroTrip([soon, now, past], TODAY)?.id).toBe(1)
    expect(pickHeroTrip([past, soon], TODAY)?.id).toBe(2)
    expect(pickHeroTrip([past], TODAY)).toBeNull()
  })

  it('daysUntil counts calendar days, DST-safe', () => {
    expect(daysUntil('2026-03-13', '2026-03-01')).toBe(12)
    expect(daysUntil('2026-03-30', '2026-03-20')).toBe(10)
  })

  it('tripDayProgress gives day and total, null without end date', () => {
    expect(tripDayProgress(makeTrip(1, '2026-03-01', '2026-03-07'), '2026-03-03')).toEqual({
      day: 3,
      total: 7,
    })
    expect(tripDayProgress(makeTrip(1, '2026-03-01', null), '2026-03-03')).toBeNull()
  })
})
