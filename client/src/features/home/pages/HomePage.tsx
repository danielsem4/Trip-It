import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth'

export function HomePage() {
  const { t } = useTranslation('home')
  const { user } = useAuth()

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center sm:py-16">
      <h1 className="text-2xl font-semibold text-balance sm:text-3xl">{t('welcome', { name: user?.name ?? user?.email })}</h1>
      <p className="text-balance text-muted-foreground">{t('subtitle')}</p>
    </div>
  )
}
