import { useTranslation } from 'react-i18next'
import { TRIP_SECTIONS, type TripSectionKey } from '../lib/tripSections'

interface TripSectionPlaceholderPageProps {
  section: TripSectionKey
}

export function TripSectionPlaceholderPage({ section }: Readonly<TripSectionPlaceholderPageProps>) {
  const { t } = useTranslation(['trips', 'common'])
  const { titleKey, icon: Icon } = TRIP_SECTIONS.find((s) => s.key === section)!

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
        <Icon className="size-7" aria-hidden />
      </div>
      <h2 className="text-xl font-semibold">{t(titleKey, { ns: 'common' })}</h2>
      <p className="text-muted-foreground text-balance">{t('section.empty')}</p>
    </div>
  )
}
