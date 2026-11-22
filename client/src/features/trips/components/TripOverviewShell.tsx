import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CalendarDays, MapPin, Pencil, Trash2 } from 'lucide-react'
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
import { useDeleteTrip } from '../hooks/useTrips'
import { canEditTrip } from '../hooks/useTrip'
import { useTripCountdown } from '../hooks/useTripCountdown'
import { useToday } from '../hooks/useToday'
import { formatTripDates } from '../lib/tripDates'
import { TripCover } from './TripCover'
import { TripFormDialog } from './TripFormDialog'
import { TripMembers } from './TripMembers'
import type { Trip } from '../types/trip.types'

interface TripOverviewShellProps {
  trip: Trip
  // The trip's content summary, shown between the header and the members list.
  children: ReactNode
}

// The trip's own details (cover, dates, members, edit / delete) around its overview content.
export function TripOverviewShell({ trip, children }: Readonly<TripOverviewShellProps>) {
  const { t, i18n } = useTranslation('trips')
  const locale = i18n.resolvedLanguage ?? i18n.language
  const navigate = useNavigate()
  const deleteTrip = useDeleteTrip()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const today = useToday()
  const countdown = useTripCountdown(trip, today)
  const canEdit = canEditTrip(trip)
  const canDelete = trip.myRole === 'OWNER'

  function handleDelete() {
    deleteTrip.mutate(trip.id, {
      onSuccess: () => {
        toast.success(t('details.deleted'))
        navigate('/home')
      },
      onError: () => {
        setDeleteOpen(false)
        toast.error(t('details.deleteFailed'))
      },
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="h-40 w-full overflow-hidden rounded-xl sm:h-56">
        <TripCover trip={trip} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-2xl font-bold break-words"><bdi>{trip.title}</bdi></h1>
          <p className="text-muted-foreground flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0" aria-hidden />
            <span className="break-words"><bdi>{trip.destination}</bdi></span>
          </p>
          <p className="text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            {formatTripDates(trip, locale)}
          </p>
          {countdown && <p className="text-primary font-medium">{countdown}</p>}
        </div>
        {(canEdit || canDelete) && (
          <div className="flex shrink-0 gap-2">
            {canEdit && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" aria-hidden />
                {t('details.edit')}
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" aria-hidden />
                {t('details.delete')}
              </Button>
            )}
          </div>
        )}
      </div>

      {children}

      <TripMembers trip={trip} />

      {canEdit && <TripFormDialog open={editOpen} onOpenChange={setEditOpen} trip={trip} />}

      {canDelete && (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('details.deleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('details.deleteDescription', { title: trip.title })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteTrip.isPending}>
                {t('form.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteTrip.isPending}
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete()
                }}
              >
                {t('details.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
