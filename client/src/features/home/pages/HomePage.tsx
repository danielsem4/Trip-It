import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth'

export function HomePage() {
  const { t } = useTranslation('home')
  const { user } = useAuth()

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <h1 className="text-3xl font-semibold">{t('welcome', { name: user?.name ?? user?.email })}</h1>
      <p className="text-muted-foreground">{t('subtitle')}</p>
    </div>
  )
}
