import { Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Languages, LogOut, Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth'

export function AppLayout() {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()
  const { clearAuth } = useAuth()

  async function handleLogout() {
    await clearAuth()
    navigate('/login')
  }

  function toggleLanguage() {
    i18n.changeLanguage(i18n.resolvedLanguage === 'he' ? 'en' : 'he')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between glass-strong sticky top-0 z-10 border-x-0 border-t-0 px-6 py-3">
        <div className="flex items-center gap-2 font-display font-semibold text-primary">
          <Plane className="h-5 w-5" />
          {t('appName')}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-2">
            <Languages className="h-4 w-4" />
            {t('language')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            {t('signOut')}
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col p-6">
        <Outlet />
      </main>
    </div>
  )
}
