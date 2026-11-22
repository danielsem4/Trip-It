import axios from 'axios'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { Spinner } from '@/components/ui/spinner'
import { AuthCard } from '@/features/auth'
import { useAcceptInvite, useInviteQuery } from '../hooks/useTrips'
import { tripPath } from '../lib/tripSections'

// Where a share link lands: shows the trip and lets a signed-in person join it.
export function InvitePage() {
  const { t } = useTranslation('trips')
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const query = useInviteQuery(token)
  const accept = useAcceptInvite(token)
  const invite = query.data

  if (query.isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-label={t('invite.loading')}>
        <Spinner />
      </div>
    )
  }

  if (!invite) {
    const gone = axios.isAxiosError(query.error) && query.error.response?.status === 404
    return (
      <AuthCard title={t('invite.goneTitle')} subtitle={gone ? t('invite.goneSubtitle') : t('invite.errorSubtitle')}>
        <div className="flex flex-col gap-2">
          {!gone && (
            <Button className="h-11 w-full text-base" onClick={() => query.refetch()}>
              {t('invite.retry')}
            </Button>
          )}
          <Button asChild variant={gone ? 'default' : 'outline'} className="h-11 w-full text-base">
            <Link to="/home">{t('invite.home')}</Link>
          </Button>
        </div>
      </AuthCard>
    )
  }

  function handleJoin() {
    accept.mutate(undefined, {
      onSuccess: (tripId) => {
        toast.success(t('invite.joined'))
        navigate(tripPath(tripId), { replace: true })
      },
      onError: () => toast.error(t('invite.joinFailed')),
    })
  }

  return (
    <AuthCard
      title={t('invite.title')}
      subtitle={invite.invitedBy ? t('invite.subtitle', { name: invite.invitedBy }) : t('invite.subtitleNoName')}
    >
      <div className="glass-subtle flex flex-col gap-1 rounded-xl border p-4 text-center">
        <p className="text-lg font-semibold break-words">
          <bdi>{invite.title}</bdi>
        </p>
        <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-sm">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span className="break-words">
            <bdi>{invite.destination}</bdi>
          </span>
        </p>
      </div>

      {invite.alreadyMember ? (
        <>
          <p className="text-muted-foreground text-center text-sm">{t('invite.alreadyMember')}</p>
          <Button asChild className="h-11 w-full text-base">
            <Link to={tripPath(invite.tripId)} replace>
              {t('invite.open')}
            </Link>
          </Button>
        </>
      ) : (
        <>
          <p className="text-muted-foreground text-center text-sm">
            {t('invite.as')}{' '}
            <span className="text-foreground font-medium">{t(`card.role.${invite.role}`)}</span>
          </p>
          <LoadingButton className="h-11 w-full text-base" loading={accept.isPending} onClick={handleJoin}>
            {t('invite.join')}
          </LoadingButton>
        </>
      )}
    </AuthCard>
  )
}
