import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { LogOut, Share2, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/features/auth'
import { useLeaveTrip, useRemoveMember, useSetMemberRole } from '../hooks/useTrips'
import type { GuestRole, Trip, TripMember } from '../types/trip.types'
import { RoleSelect } from './RoleSelect'
import { ShareTripDialog } from './ShareTripDialog'

const displayName = (member: TripMember) => member.name?.trim() || member.email

// Who is on the trip. Its owner shares it and manages the others; anyone else can leave.
export function TripMembers({ trip }: Readonly<{ trip: Trip }>) {
  const { t } = useTranslation('trips')
  const navigate = useNavigate()
  const { user } = useAuth()
  const setRole = useSetMemberRole(trip.id)
  const removeMember = useRemoveMember(trip.id)
  const leaveTrip = useLeaveTrip(trip.id)
  const [shareOpen, setShareOpen] = useState(false)
  // The member being removed, or myself when leaving.
  const [leaving, setLeaving] = useState<TripMember | null>(null)
  const isOwner = trip.myRole === 'OWNER'
  const leavingMyself = leaving?.userId === user?.id
  const pending = removeMember.isPending || leaveTrip.isPending

  function handleRole(member: TripMember, role: GuestRole) {
    setRole.mutate(
      { userId: member.userId, role },
      {
        onSuccess: () => toast.success(t('members.roleChanged')),
        onError: () => toast.error(t('members.roleFailed')),
      },
    )
  }

  function handleConfirm() {
    if (!leaving) return
    if (leavingMyself) {
      leaveTrip.mutate(leaving.userId, {
        onSuccess: () => {
          toast.success(t('members.left'))
          navigate('/home')
        },
        onError: () => {
          setLeaving(null)
          toast.error(t('members.leaveFailed'))
        },
      })
      return
    }
    removeMember.mutate(leaving.userId, {
      onSuccess: () => toast.success(t('members.removed')),
      onError: () => toast.error(t('members.removeFailed')),
      onSettled: () => setLeaving(null),
    })
  }

  return (
    <section className="glass rounded-xl p-4" aria-labelledby="trip-members">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="trip-members" className="text-base font-semibold">
          {t('card.members')}
        </h2>
        {isOwner && (
          <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
            <Share2 className="size-4" aria-hidden />
            {t('members.share')}
          </Button>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {trip.members.map((member) => {
          const name = displayName(member)
          const isMe = member.userId === user?.id
          const manageable = isOwner && member.role !== 'OWNER'
          return (
            <li
              key={member.userId}
              className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="min-w-0 truncate">
                <bdi>{name}</bdi>
                {isMe && <span className="text-muted-foreground"> · {t('members.you')}</span>}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                {manageable ? (
                  <>
                    <RoleSelect
                      value={member.role as GuestRole}
                      onChange={(role) => handleRole(member, role)}
                      disabled={setRole.isPending}
                      aria-label={t('members.roleOf', { name })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setLeaving(member)}
                      aria-label={t('members.remove', { name })}
                    >
                      <UserMinus aria-hidden />
                    </Button>
                  </>
                ) : (
                  <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                    {t(`card.role.${member.role}`)}
                  </span>
                )}
                {isMe && !isOwner && (
                  <Button variant="outline" size="sm" onClick={() => setLeaving(member)}>
                    <LogOut className="size-4 rtl:rotate-180" aria-hidden />
                    {t('members.leave')}
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {isOwner && <ShareTripDialog open={shareOpen} onOpenChange={setShareOpen} trip={trip} />}

      <AlertDialog open={leaving !== null} onOpenChange={(open) => !open && setLeaving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {leavingMyself ? t('members.leaveTitle') : t('members.removeTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {leavingMyself
                ? t('members.leaveDescription', { title: trip.title })
                : t('members.removeDescription', { name: leaving ? displayName(leaving) : '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t('members.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(e) => {
                // Stay open until the request settles.
                e.preventDefault()
                handleConfirm()
              }}
            >
              {leavingMyself ? t('members.leaveConfirm') : t('members.removeConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
