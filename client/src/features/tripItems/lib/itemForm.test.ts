import { describe, expect, it } from 'vitest'
import { buildSchema, defaultValues, normalizeUrl, toPayload } from './itemForm'
import type { FieldDef } from '../types/tripItem.types'

const fields: FieldDef[] = [
  { kind: 'select', name: 'type', options: ['HOTEL', 'APARTMENT'] },
  { kind: 'text', name: 'name', required: true },
  { kind: 'date', name: 'checkInDate', required: true },
  { kind: 'date', name: 'checkOutDate', notBefore: 'checkInDate' },
  { kind: 'time', name: 'checkInTime' },
  { kind: 'url', name: 'website' },
  { kind: 'textarea', name: 'notes' },
  { kind: 'price' },
]
const schema = buildSchema(fields)
const valid = {
  type: 'HOTEL',
  name: 'Hotel V',
  checkInDate: '2027-05-12',
  checkOutDate: '2027-05-18',
  checkInTime: '',
  website: '',
  notes: '',
  priceAmount: '',
  priceCurrency: 'ILS',
}
const errorsOf = (values: object) => {
  const result = schema.safeParse(values)
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]))
}

describe('buildSchema', () => {
  it('accepts a minimal valid form', () => {
    expect(errorsOf(valid)).toEqual({})
  })

  it('reports required text and dates', () => {
    expect(errorsOf({ ...valid, name: '  ', checkInDate: '' })).toEqual({
      name: 'validation.required',
      checkInDate: 'validation.required',
    })
  })

  it('rejects an end date before its start date', () => {
    expect(errorsOf({ ...valid, checkOutDate: '2027-05-11' })).toEqual({
      checkOutDate: 'validation.beforeStart',
    })
  })

  it('validates amounts, times and links', () => {
    expect(errorsOf({ ...valid, priceAmount: '12,50', checkInTime: '15:00', website: 'booking.com/x' })).toEqual({})
    expect(errorsOf({ ...valid, priceAmount: '-3', checkInTime: '25:00', website: 'javascript:alert(1)' })).toEqual({
      priceAmount: 'validation.amount',
      checkInTime: 'validation.time',
      website: 'validation.url',
    })
  })
})

describe('defaultValues', () => {
  it('starts a new item with the first option and the trip currency', () => {
    expect(defaultValues(fields, undefined, 'EUR')).toMatchObject({
      type: 'HOTEL',
      name: '',
      priceAmount: '',
      priceCurrency: 'EUR',
    })
  })

  it('fills from an existing item', () => {
    const item = { type: 'APARTMENT', name: 'Loft', priceAmount: 90.5, priceCurrency: 'USD', notes: null }
    expect(defaultValues(fields, item, 'EUR')).toMatchObject({
      type: 'APARTMENT',
      name: 'Loft',
      notes: '',
      priceAmount: '90.5',
      priceCurrency: 'USD',
    })
  })
})

describe('toPayload', () => {
  it('turns blanks into null and drops the currency when there is no amount', () => {
    expect(toPayload(fields, valid)).toEqual({
      type: 'HOTEL',
      name: 'Hotel V',
      checkInDate: '2027-05-12',
      checkOutDate: '2027-05-18',
      checkInTime: null,
      website: null,
      notes: null,
      priceAmount: null,
      priceCurrency: null,
    })
  })

  it('parses the amount and adds a scheme to links', () => {
    const payload = toPayload(fields, { ...valid, priceAmount: '12,5', website: ' booking.com/x ' })
    expect(payload).toMatchObject({
      priceAmount: 12.5,
      priceCurrency: 'ILS',
      website: 'https://booking.com/x',
    })
  })
})

describe('normalizeUrl', () => {
  it('keeps an existing scheme as is', () => {
    expect(normalizeUrl('http://a.b')).toBe('http://a.b')
    expect(normalizeUrl('javascript:alert(1)')).toBe('javascript:alert(1)')
    expect(normalizeUrl('')).toBe('')
  })
})
