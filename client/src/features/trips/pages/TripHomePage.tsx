import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { canEditTrip, useTrip } from '../hooks/useTrip'
import { useTripCountdown } from '../hooks/useTripCountdown'
import { useToday } from '../hooks/useToday'
import { formatTripDates } from '../lib/tripDates'
import { TripCover } from '../components/TripCover'
import { TripFormDialog } from '../components/TripFormDialog'
import { TRIP_SECTIONS, tripPath } from '../lib/tripSections'

export function TripHomePage() {
  const trip = useTrip()
  const { t: tNav } = useTranslation('common')
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

      <section className="glass rounded-xl p-4" aria-labelledby="trip-members">
        <h2 id="trip-members" className="mb-3 text-base font-semibold">
          {t('card.members')}
        </h2>
        <ul className="flex flex-col gap-2">
          {trip.members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate"><bdi>{m.name?.trim() || m.email}</bdi></span>
              <span className="bg-secondary text-secondary-foreground shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
                {t(`card.role.${m.role}`)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label={t('home.sections')} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TRIP_SECTIONS.map(({ key, titleKey, icon: Icon }) => (
          <Link
            key={key}
            to={tripPath(trip.id, key)}
            className="glass hover:bg-primary/10 focus-visible:ring-ring/50 flex min-h-20 flex-col gap-2 rounded-xl p-4 outline-none transition focus-visible:ring-[3px]"
          >
            <Icon className="text-primary size-5" aria-hidden />
            <span className="font-medium">{tNav(titleKey)}</span>
          </Link>
        ))}
      </nav>

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
