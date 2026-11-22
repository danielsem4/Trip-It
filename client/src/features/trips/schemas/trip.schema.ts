import { z } from 'zod'
import { COVER_COLORS } from '../lib/coverColors'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.dateInvalid')

export const tripFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'validation.titleRequired')
      .max(100, 'validation.titleTooLong'),
    destination: z
      .string()
      .trim()
      .min(1, 'validation.destinationRequired')
      .max(100, 'validation.destinationTooLong'),
    startDate: isoDate,
    endDate: isoDate.nullable().optional(),
    coverColor: z.enum(COVER_COLORS),
  })
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    message: 'validation.endBeforeStart',
    path: ['endDate'],
  })

export type TripFormData = z.infer<typeof tripFormSchema>
