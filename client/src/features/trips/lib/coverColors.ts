export const COVER_COLORS = [
  'sky',
  'teal',
  'emerald',
  'amber',
  'orange',
  'rose',
  'violet',
  'slate',
] as const

export type CoverColor = (typeof COVER_COLORS)[number]

const COVER_CLASSES: Record<CoverColor, string> = {
  sky: 'bg-gradient-to-br from-sky-400 to-blue-600',
  teal: 'bg-gradient-to-br from-teal-400 to-cyan-600',
  emerald: 'bg-gradient-to-br from-emerald-400 to-green-600',
  amber: 'bg-gradient-to-br from-amber-300 to-orange-500',
  orange: 'bg-gradient-to-br from-orange-400 to-red-500',
  rose: 'bg-gradient-to-br from-rose-400 to-pink-600',
  violet: 'bg-gradient-to-br from-violet-400 to-purple-600',
  slate: 'bg-gradient-to-br from-slate-400 to-slate-700',
}

export function coverClass(color: string): string {
  return COVER_CLASSES[color as CoverColor] ?? COVER_CLASSES.sky
}
