import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Copy, Link2Off, Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { Spinner } from '@/components/ui/spinner'
import { useDeleteTripInvite, useSaveTripInvite, useTripInviteQuery } from '../hooks/useTrips'
import type { GuestRole, Trip } from '../types/trip.types'
import { RoleSelect } from './RoleSelect'

interface ShareTripDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trip: Trip
}

export function ShareTripDialog({ open, onOpenChange, trip }: Readonly<ShareTripDialogProps>) {
  const { t } = useTranslation('trips')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('share.title')}</DialogTitle>
          <DialogDescription>{t('share.description')}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the link is fetched when it's needed. */}
        <ShareLink trip={trip} />
      </DialogContent>
    </Dialog>
  )
}

function ShareLink({ trip }: Readonly<{ trip: Trip }>) {
  const { t } = useTranslation('trips')
  const query = useTripInviteQuery(trip.id)
  const saveInvite = useSaveTripInvite(trip.id)
  const deleteInvite = useDeleteTripInvite(trip.id)
  // The role a new link will get; an existing link carries its own.
  const [newRole, setNewRole] = useState<GuestRole>('VIEWER')
  const invite = query.data
  const role = invite?.role ?? newRole
  const busy = saveInvite.isPending || deleteInvite.isPending
  const failed = () => toast.error(t('share.failed'))

  if (query.isPending) {
    return (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    )
  }
  if (query.isError) {
    return <p className="text-destructive text-sm">{t('share.loadFailed')}</p>
  }

  const url = invite ? `${window.location.origin}/invite/${invite.token}` : ''

  function handleRole(next: GuestRole) {
    if (invite) saveInvite.mutate(next, { onError: failed })
    else setNewRole(next)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t('share.copied'))
    } catch {
      toast.error(t('share.copyFailed'))
    }
  }

  function handleSend() {
    // Rejects when the share sheet is dismissed: nothing to report.
    navigator.share({ text: t('share.sendText', { title: trip.title }), url }).catch(() => undefined)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="share-role">{t('share.role')}</Label>
        <RoleSelect id="share-role" value={role} onChange={handleRole} disabled={busy} className="w-full" />
        <p className="text-muted-foreground text-sm">{t(`share.roleHint.${role}`)}</p>
      </div>

      {invite ? (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="share-link">{t('share.link')}</Label>
            <Input
              id="share-link"
              readOnly
              dir="ltr"
              value={url}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={handleCopy}>
              <Copy className="size-4" aria-hidden />
              {t('share.copy')}
            </Button>
            {typeof navigator.share === 'function' && (
              <Button className="flex-1" variant="outline" onClick={handleSend}>
                <Send className="size-4 rtl:-scale-x-100" aria-hidden />
                {t('share.send')}
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={busy}
            onClick={() =>
              deleteInvite.mutate(undefined, {
                onSuccess: () => toast.success(t('share.turnedOff')),
                onError: failed,
              })
            }
          >
            <Link2Off className="size-4" aria-hidden />
            {t('share.turnOff')}
          </Button>
        </>
      ) : (
        <LoadingButton
          loading={saveInvite.isPending}
          onClick={() => saveInvite.mutate(newRole, { onError: failed })}
        >
          {t('share.create')}
        </LoadingButton>
      )}
    </div>
  )
}
