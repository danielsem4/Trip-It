import { useTranslation } from 'react-i18next'
import type { TripMember } from '../types/trip.types'

interface MemberAvatarsProps {
  members: TripMember[]
  max?: number
}

function initials(member: TripMember): string {
  const source = (member.name?.trim() || member.email).trim()
  const words = source.split(/\s+/)
  const letters = words.length > 1 ? words[0]![0]! + words[1]![0]! : source.slice(0, 2)
  return letters.toUpperCase()
}

export function MemberAvatars({ members, max = 3 }: Readonly<MemberAvatarsProps>) {
  const { t } = useTranslation('trips')
  const shown = members.slice(0, max)
  const extra = members.length - shown.length

  return (
    <div className="flex items-center" role="group" aria-label={t('card.members')}>
      {shown.map((m) => (
        <span
          key={m.userId}
          title={m.name ?? m.email}
          className="bg-primary/15 text-primary ring-background -ms-2 flex size-7 items-center justify-center rounded-full text-[11px] font-semibold ring-2 first:ms-0"
        >
          {initials(m)}
        </span>
      ))}
      {extra > 0 && (
        <span className="bg-muted text-muted-foreground ring-background -ms-2 flex size-7 items-center justify-center rounded-full text-[11px] font-semibold ring-2">
          {t('card.moreMembers', { count: extra })}
        </span>
      )}
    </div>
  )
}
