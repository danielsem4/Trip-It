import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CheckCircle2, Circle, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NotFoundPage } from '@/components/shared/NotFoundPage'
import { canEditTrip, tripPath, useTrip, type Trip } from '@/features/trips'
import { ConfirmDeleteDialog, ItemSection, itemApi } from '@/features/tripItems'
import {
  placeCard,
  placeFields,
  sectionIcon,
  sectionScope,
  type Place,
  type Section,
  type SectionKind,
} from './places.config'
import { SectionForm } from './SectionForm'
import { useDeleteSection, useSaveSection, useSectionsQuery, useSetPlaceDone } from './useSections'

interface PlacesPageProps {
  // A built-in section; without it the custom section comes from the :sectionId param.
  kind?: Exclude<SectionKind, 'CUSTOM'>
}

export function PlacesPage({ kind }: Readonly<PlacesPageProps>) {
  const trip = useTrip()
  const { sectionId } = useParams()
  const { t } = useTranslation('tripItems')
  const query = useSectionsQuery(trip.id)

  if (query.isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-muted-foreground">{t('common.loadFailed')}</p>
        <Button onClick={() => void query.refetch()}>{t('common.retry')}</Button>
      </div>
    )
  }
  if (!query.data) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner className="text-primary size-8" aria-label={t('common.loading')} />
      </div>
    )
  }

  const section = query.data.find((s) =>
    kind ? s.kind === kind : s.kind === 'CUSTOM' && String(s.id) === sectionId,
  )
  if (!section) return <NotFoundPage />
  // Keyed so dialogs and form state don't leak from one section to the next.
  return <PlacesSection key={section.id} trip={trip} section={section} />
}

function PlacesSection({ trip, section }: Readonly<{ trip: Trip; section: Section }>) {
  const { t, i18n } = useTranslation('tripItems')
  const locale = i18n.resolvedLanguage ?? i18n.language
  const canEdit = canEditTrip(trip)
  const setDone = useSetPlaceDone(trip.id, section.id)

  const api = useMemo(() => {
    const base = itemApi<Place>(`/trips/${trip.id}/sections/${section.id}/places`, 'place', 'places')
    const doneOf = new Map(section.places.map((p) => [p.id, p.done]))
    return {
      ...base,
      // The form doesn't carry "visited", and an update replaces the whole place.
      update: (id: number, data: Parameters<typeof base.update>[1]) =>
        base.update(id, { ...data, done: doneOf.get(id) ?? false }),
    }
  }, [trip.id, section.id, section.places])

  function renderDone(place: Place) {
    const Icon = place.done ? CheckCircle2 : Circle
    const label = t(place.done ? 'places.markNotDone' : 'places.markDone', { name: place.name })
    if (!canEdit) {
      return <Icon className="text-muted-foreground mt-0.5 size-6 shrink-0" aria-label={place.done ? t('places.done') : undefined} />
    }
    return (
      <button
        type="button"
        aria-pressed={place.done}
        aria-label={label}
        title={label}
        disabled={setDone.isPending}
        onClick={() =>
          setDone.mutate(
            { placeId: place.id, done: !place.done },
            { onError: () => toast.error(t('common.saveFailed')) },
          )
        }
        className="focus-visible:ring-ring/50 -m-2 flex size-10 shrink-0 items-center justify-center self-start rounded-full outline-none focus-visible:ring-[3px]"
      >
        <Icon className={place.done ? 'text-primary size-6' : 'text-muted-foreground size-6'} aria-hidden />
      </button>
    )
  }

  return (
    <ItemSection
      trip={trip}
      scope={sectionScope(section.kind)}
      fieldScope="places"
      title={section.name ?? undefined}
      icon={sectionIcon(section)}
      items={section.places}
      isError={false}
      onRetry={() => undefined}
      fields={placeFields}
      api={api}
      toCard={(place) => placeCard(place, t, locale)}
      renderLeading={renderDone}
      isMuted={(place) => place.done}
      actions={section.kind === 'CUSTOM' && canEdit ? <SectionActions trip={trip} section={section} /> : null}
    />
  )
}

// Rename / delete for a custom section.
function SectionActions({ trip, section }: Readonly<{ trip: Trip; section: Section }>) {
  const { t } = useTranslation('tripItems')
  const navigate = useNavigate()
  const save = useSaveSection(trip.id)
  const remove = useDeleteSection(trip.id)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} aria-label={t('sections.edit')}>
        <Pencil aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive"
        onClick={() => setDeleteOpen(true)}
        aria-label={t('sections.delete')}
      >
        <Trash2 aria-hidden />
      </Button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sections.edit')}</DialogTitle>
            <DialogDescription className="sr-only">{t('sections.addDescription')}</DialogDescription>
          </DialogHeader>
          <SectionForm
            section={section}
            saving={save.isPending}
            onCancel={() => setEditOpen(false)}
            onSubmit={(data) =>
              save.mutate(
                { id: section.id, data },
                {
                  onSuccess: () => setEditOpen(false),
                  onError: () => toast.error(t('common.saveFailed')),
                },
              )
            }
          />
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('sections.deleteTitle')}
        description={t('sections.deleteDescription', { name: section.name, count: section.places.length })}
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(section.id, {
            onSuccess: () => navigate(tripPath(trip.id), { replace: true }),
            onError: () => {
              setDeleteOpen(false)
              toast.error(t('common.deleteFailed'))
            },
          })
        }
      />
    </>
  )
}
