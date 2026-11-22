import { z } from 'zod'
import type { FieldDef, FormValues, ItemPayload } from '../types/tripItem.types'

// Error messages are keys under `validation` in the `tripItems` namespace.
const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const AMOUNT = /^\d{1,10}([.,]\d{1,2})?$/
const HTTP_URL = /^https?:\/\/\S+$/i
const NOTES_MAX = 2000

// People paste "booking.com/..." without a scheme; only http(s) links are ever stored.
export function normalizeUrl(raw: string): string {
  const value = raw.trim()
  if (!value) return ''
  return /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`
}

const parseAmount = (raw: string): number => Number(raw.trim().replace(',', '.'))

export function buildSchema(fields: FieldDef[]) {
  const shape: Record<string, z.ZodType<string, string>> = {}

  for (const field of fields) {
    switch (field.kind) {
      case 'text':
      case 'textarea': {
        const max = field.max ?? (field.kind === 'textarea' ? NOTES_MAX : 150)
        const text = z.string().trim().max(max, 'validation.tooLong')
        shape[field.name] = field.required ? text.min(1, 'validation.required') : text
        break
      }
      case 'date':
        shape[field.name] = z
          .string()
          .refine((v) => (v === '' ? !field.required : DATE.test(v)), {
            error: (issue) => (issue.input === '' ? 'validation.required' : 'validation.date'),
          })
        break
      case 'time':
        shape[field.name] = z.string().refine((v) => v === '' || TIME.test(v), 'validation.time')
        break
      case 'url':
        shape[field.name] = z
          .string()
          .trim()
          .max(1000, 'validation.tooLong')
          .refine((v) => v === '' || HTTP_URL.test(normalizeUrl(v)), 'validation.url')
        break
      case 'select':
        shape[field.name] = z.string().refine((v) => field.options.includes(v), 'validation.required')
        break
      case 'price':
        shape['priceAmount'] = z
          .string()
          .trim()
          .refine((v) => (v === '' ? !field.required : AMOUNT.test(v)), {
            error: (issue) => (issue.input === '' ? 'validation.required' : 'validation.amount'),
          })
        shape['priceCurrency'] = z.string()
        break
    }
  }

  return z.object(shape).superRefine((values, ctx) => {
    for (const field of fields) {
      if (field.kind !== 'date' || !field.notBefore) continue
      const end = values[field.name]
      const start = values[field.notBefore]
      if (end && start && end < start) {
        ctx.addIssue({ code: 'custom', message: 'validation.beforeStart', path: [field.name] })
      }
    }
  })
}

type ItemLike = Record<string, unknown>

export function defaultValues(fields: FieldDef[], item: ItemLike | undefined, tripCurrency: string): FormValues {
  const values: FormValues = {}
  const text = (name: string) => {
    const value = item?.[name]
    return value === null || value === undefined ? '' : String(value)
  }
  for (const field of fields) {
    if (field.kind === 'price') {
      values['priceAmount'] = text('priceAmount')
      values['priceCurrency'] = text('priceCurrency') || tripCurrency
    } else if (field.kind === 'select') {
      values[field.name] = text(field.name) || field.options[0]
    } else {
      values[field.name] = text(field.name)
    }
  }
  return values
}

// Form strings -> API payload: blanks become null, the amount a number, links get a scheme.
export function toPayload(fields: FieldDef[], values: FormValues): ItemPayload {
  const payload: ItemPayload = {}
  for (const field of fields) {
    if (field.kind === 'price') {
      const amount = values['priceAmount'].trim()
      payload['priceAmount'] = amount === '' ? null : parseAmount(amount)
      payload['priceCurrency'] = amount === '' ? null : values['priceCurrency']
    } else if (field.kind === 'url') {
      payload[field.name] = normalizeUrl(values[field.name]) || null
    } else {
      payload[field.name] = values[field.name].trim() || null
    }
  }
  return payload
}
