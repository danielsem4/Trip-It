import type { Price } from '../types/tripItem.types'

const asDate = (day: string) => new Date(`${day}T00:00:00Z`)

// 'YYYY-MM-DD' -> "Wed, 12 May" (with the year when it isn't the current one).
export function formatDay(day: string, locale: string): string {
  const sameYear = day.slice(0, 4) === String(new Date().getFullYear())
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
    timeZone: 'UTC',
  }).format(asDate(day))
}

// Times are plain 'HH:mm' and shown as entered; ⁦..⁩ keeps them LTR inside RTL text.
export function formatDayTime(day: string, time: string | null, locale: string): string {
  const date = formatDay(day, locale)
  return time ? `${date} · ⁦${time}⁩` : date
}

export function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount)
  } catch {
    // An unknown currency code makes Intl throw.
    return `${amount} ${currency}`
  }
}

export function formatPrice(price: Price, locale: string): string | null {
  if (price.priceAmount === null || !price.priceCurrency) return null
  return formatMoney(price.priceAmount, price.priceCurrency, locale)
}

export function nightsBetween(from: string, to: string): number {
  return Math.round((asDate(to).getTime() - asDate(from).getTime()) / 86_400_000)
}
