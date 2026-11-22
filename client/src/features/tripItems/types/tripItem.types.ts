import type { LucideIcon } from 'lucide-react'

export interface Price {
  priceAmount: number | null
  priceCurrency: string | null
}

// One input of an item form. The same list drives the form, its validation and the payload,
// so an item kind is described once. Labels live at `<scope>.fields.<name>` in `tripItems`.
export type FieldDef =
  | {
      kind: 'text' | 'textarea'
      name: string
      required?: boolean
      max?: number
      half?: boolean
    }
  | {
      kind: 'date'
      name: string
      required?: boolean
      half?: boolean
      // Name of a date field this one can't come before.
      notBefore?: string
    }
  | { kind: 'time'; name: string; half?: boolean }
  | { kind: 'url'; name: string }
  // Option labels live at `<scope>.options.<name>.<option>`.
  | { kind: 'select'; name: string; options: readonly string[]; half?: boolean }
  // Always the `priceAmount` + `priceCurrency` pair.
  | { kind: 'price'; required?: boolean }

export type FormValues = Record<string, string>
export type ItemPayload = Record<string, string | number | boolean | null>

export interface CardLine {
  icon: LucideIcon
  text: string
  // User-entered text gets bidi isolation; formatted dates and labels don't need it.
  user?: boolean
}

export interface CardContent {
  title: string
  // A thumbnail shown beside the text.
  image?: string | null
  badge?: string
  lines: CardLine[]
  links?: { label: string; url: string }[]
  notes?: string | null
  price?: Price
}
