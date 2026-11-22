import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AppSidebar, MobileSidebar } from './AppSidebar'
import { navItems } from './navItems'

// Matches Tailwind's `md` breakpoint: the drawer is only used below it.
const tabletUp = window.matchMedia('(min-width: 48rem)')

export function AppLayout() {
  const { t } = useTranslation('common')
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const current = navItems.find((item) => pathname.startsWith(item.url))

  // Close the drawer when the viewport grows past the phone layout (links close it on tap).
  useEffect(() => {
    const close = () => tabletUp.matches && setMobileOpen(false)
    tabletUp.addEventListener('change', close)
    return () => tabletUp.removeEventListener('change', close)
  }, [])

  const CollapseIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <div className="min-h-dvh">
      <AppSidebar collapsed={collapsed} />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
      <div
        className={cn(
          'flex min-h-dvh flex-col transition-[margin] duration-300 md:ms-16',
          !collapsed && 'lg:ms-64',
        )}
      >
        <header className="glass-strong sticky top-0 z-10 flex min-h-14 items-center gap-2 border-x-0 border-t-0 px-2 pt-[env(safe-area-inset-top)] sm:px-4">
          <Button
            variant="ghost"
            size="icon-lg"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label={t('nav.openMenu')}
            aria-expanded={mobileOpen}
          >
            <Menu className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            className="hidden lg:inline-flex"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={t(collapsed ? 'nav.expandSidebar' : 'nav.collapseSidebar')}
            aria-pressed={collapsed}
          >
            <CollapseIcon className="size-5 rtl:-scale-x-100" />
          </Button>
          {current && (
            <h1 className="truncate text-base font-semibold sm:text-lg md:ps-2 lg:ps-0">
              {t(current.titleKey)}
            </h1>
          )}
        </header>
        <main className="flex flex-1 flex-col p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
