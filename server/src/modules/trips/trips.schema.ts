import { z } from 'zod';

export const COVER_COLORS = [
  'sky',
  'emerald',
  'amber',
  'rose',
  'violet',
  'orange',
  'teal',
  'slate',
] as const;

const isoDate = z.iso.date();
const coverColor = z.enum(COVER_COLORS);

export const createTripSchema = z
  .object({
    title: z.string().trim().min(1).max(100),
    destination: z.string().trim().min(1).max(100),
    startDate: isoDate,
    endDate: isoDate.nullable().optional(),
    coverColor: coverColor.optional(),
  })
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  });

export const updateTripSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  destination: z.string().trim().min(1).max(100).optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.nullable().optional(),
  coverColor: coverColor.optional(),
});

export const guestRole = z.enum(['EDITOR', 'VIEWER']);
export const memberRoleSchema = z.object({ role: guestRole });

export type CreateTripDto = z.infer<typeof createTripSchema>;
export type UpdateTripDto = z.infer<typeof updateTripSchema>;
