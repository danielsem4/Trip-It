import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-2 py-8 text-center sm:gap-4">
      <FileQuestion className="h-12 w-12 text-muted-foreground sm:h-16 sm:w-16" />
      <h1 className="text-5xl font-bold sm:text-6xl">404</h1>
      <h2 className="text-xl font-semibold sm:text-2xl">{t('errors.notFound.title')}</h2>
      <p className="text-balance text-muted-foreground">
        {t('errors.notFound.description')}
      </p>
      <Button onClick={() => navigate('/home')} size="lg" className="mt-2 h-11 sm:h-10">
        {t('errors.notFound.goHome')}
      </Button>
    </div>
  )
}
