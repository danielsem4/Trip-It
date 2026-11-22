import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { GuestRole } from '../types/trip.types'

const GUEST_ROLES: GuestRole[] = ['EDITOR', 'VIEWER']

interface RoleSelectProps {
  id?: string
  value: GuestRole
  onChange: (role: GuestRole) => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

// Editor or viewer: what a guest of the trip can be.
export function RoleSelect({ value, onChange, className, ...props }: Readonly<RoleSelectProps>) {
  const { t } = useTranslation('trips')
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as GuestRole)}
      className={cn(
        'glass-subtle h-9 min-w-0 rounded-md border px-2 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-60 md:text-sm',
        className,
      )}
      {...props}
    >
      {GUEST_ROLES.map((role) => (
        <option key={role} value={role}>
          {t(`card.role.${role}`)}
        </option>
      ))}
    </select>
  )
}
