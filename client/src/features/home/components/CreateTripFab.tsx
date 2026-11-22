import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface CreateTripFabProps {
  onClick: () => void
}

export function CreateTripFab({ onClick }: Readonly<CreateTripFabProps>) {
  const { t } = useTranslation('home')
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('newTrip')}
      className="bg-primary text-primary-foreground focus-visible:ring-ring/50 fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] end-4 z-30 flex size-14 items-center justify-center rounded-full shadow-lg outline-none transition-transform focus-visible:ring-[3px] active:scale-95 md:hidden"
    >
      <Plus className="size-6" aria-hidden />
    </button>
  )
}
