import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { NotFoundPage } from '@/components/shared/NotFoundPage'
import { canEditTrip, tripPath, useTrip } from '@/features/trips'
import { sectionSegment } from './places.config'
import { SectionForm } from './SectionForm'
import { useSaveSection } from './useSections'

// "Add section" in the trip sidebar: a page rather than a dialog, so it works from the drawer too.
export function NewSectionPage() {
  const trip = useTrip()
  const { t } = useTranslation('tripItems')
  const navigate = useNavigate()
  const save = useSaveSection(trip.id)

  if (!canEditTrip(trip)) return <NotFoundPage />

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <h2 className="sr-only">{t('sections.addTitle')}</h2>
      <p className="text-muted-foreground text-balance">{t('sections.addDescription')}</p>
      <div className="glass rounded-xl p-4">
        <SectionForm
          saving={save.isPending}
          onCancel={() => navigate(tripPath(trip.id))}
          onSubmit={(data) =>
            save.mutate(
              { id: null, data },
              {
                onSuccess: (section) => navigate(tripPath(trip.id, sectionSegment(section)), { replace: true }),
                onError: () => toast.error(t('common.saveFailed')),
              },
            )
          }
        />
      </div>
    </div>
  )
}
