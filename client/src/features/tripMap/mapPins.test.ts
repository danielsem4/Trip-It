import { describe, expect, it } from 'vitest'
import type { Stay } from '@/features/stays'
import type { Place, Section } from '@/features/places'
import type { Transport } from '@/features/transport'
import { Bed, Bus, Landmark, Star, TrainFront, Utensils } from 'lucide-react'
import { buildPins, directionsUrl, type PinLooks } from './mapPins'

const SECTION_ICONS = { ATTRACTIONS: Landmark, RESTAURANTS: Utensils, CUSTOM: Star }
const cards: PinLooks = {
  stay: (s) => ({ title: s.name, lines: [] }),
  place: (p) => ({ title: p.name, lines: [] }),
  transport: (x) => ({ title: x.title, lines: [] }),
  stayIcon: () => Bed,
  sectionIcon: (section) => SECTION_ICONS[section.kind],
  transportIcon: (x) => (x.type === 'TRAIN' ? TrainFront : Bus),
}

const stay = { id: 1, name: 'Hotel V' } as Stay
const train = { id: 5, type: 'TRAIN', title: 'Thalys', fromPlace: 'Amsterdam Centraal', toPlace: 'Paris Nord' } as Transport
const section = (id: number, kind: Section['kind'], placeIds: number[]): Section => ({
  id,
  kind,
  name: null,
  icon: null,
  places: placeIds.map((placeId) => ({ id: placeId, name: `Place ${placeId}` }) as Place),
})
const sources = {
  stays: [stay],
  transport: [train],
  sections: [section(10, 'ATTRACTIONS', [100]), section(11, 'RESTAURANTS', [101]), section(12, 'CUSTOM', [102])],
}

describe('buildPins', () => {
  it('turns a stay into a pin that opens the stays list', () => {
    const [pin] = buildPins([{ kind: 'stay', itemId: 1, lat: 52.36, lng: 4.89 }], sources, cards)
    expect(pin).toMatchObject({ key: 'stay-1', lat: 52.36, lng: 4.89, tone: 'stay', icon: Bed, title: 'Hotel V', segment: 'stays' })
    expect(pin!.content.title).toBe('Hotel V')
  })

  it('colours and links a place by the section it belongs to', () => {
    const pins = buildPins(
      [100, 101, 102].map((itemId) => ({ kind: 'place' as const, itemId, lat: 1, lng: 2 })),
      sources,
      cards,
    )
    expect(pins.map((p) => [p.tone, p.segment, p.icon])).toEqual([
      ['attractions', 'attractions', Landmark],
      ['restaurants', 'restaurants', Utensils],
      ['custom', 'sections/12', Star],
    ])
  })

  it('gives each end of a ride its own pin with the same card', () => {
    const pins = buildPins(
      [
        { kind: 'transport', itemId: 5, end: 'from', lat: 52.38, lng: 4.9 },
        { kind: 'transport', itemId: 5, end: 'to', lat: 48.88, lng: 2.35 },
      ],
      sources,
      cards,
    )
    expect(pins.map((p) => p.key)).toEqual(['transport-5-from', 'transport-5-to'])
    expect(pins.map((p) => p.title)).toEqual(['Thalys · Amsterdam Centraal', 'Thalys · Paris Nord'])
    expect(pins[0]!.content).toEqual(pins[1]!.content)
    expect(pins.map((p) => p.icon)).toEqual([TrainFront, TrainFront])
  })

  it('routes to the item\'s own address, or to the pin when it has none', () => {
    const withAddress = {
      ...sources,
      stays: [{ ...stay, address: 'Weteringschans 136, Amsterdam' } as Stay],
    }
    const pins = buildPins(
      [
        { kind: 'stay', itemId: 1, lat: 52.36, lng: 4.89 },
        { kind: 'place', itemId: 100, lat: 52.37, lng: 4.9 },
        { kind: 'transport', itemId: 5, end: 'to', lat: 48.88, lng: 2.35 },
      ],
      withAddress,
      cards,
    )
    expect(pins.map((p) => p.routeTo)).toEqual(['Weteringschans 136, Amsterdam', '52.37,4.9', 'Paris Nord'])
  })

  it('drops points whose item is not loaded', () => {
    const pins = buildPins(
      [
        { kind: 'stay', itemId: 99, lat: 1, lng: 2 },
        { kind: 'place', itemId: 99, lat: 1, lng: 2 },
        { kind: 'transport', itemId: 99, end: 'to', lat: 1, lng: 2 },
      ],
      sources,
      cards,
    )
    expect(pins).toEqual([])
  })
})

describe('directionsUrl', () => {
  it('asks Google Maps for directions to an encoded destination', () => {
    expect(directionsUrl('Rokin 17, 1012 KK Amsterdam, הולנד')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=Rokin%2017%2C%201012%20KK%20Amsterdam%2C%20%D7%94%D7%95%D7%9C%D7%A0%D7%93',
    )
  })
})
