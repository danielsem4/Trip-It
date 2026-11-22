// Currencies offered in price fields; the trip's main currency is listed first at render time.
export const CURRENCIES = [
  'ILS', 'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'NZD', 'THB', 'AED', 'TRY',
  'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'SEK', 'NOK', 'DKK', 'ISK', 'GEL', 'CNY', 'KRW',
  'SGD', 'INR', 'VND', 'IDR', 'MXN', 'BRL', 'ZAR', 'EGP', 'JOD', 'MAD',
] as const

export function currencyOptions(...first: (string | null | undefined)[]): string[] {
  const lead = first.filter((c): c is string => !!c)
  return [...new Set([...lead, ...CURRENCIES])]
}
