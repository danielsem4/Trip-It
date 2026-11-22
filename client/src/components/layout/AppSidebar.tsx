import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut, Plane } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { cn } from '@/lib/utils'
import type { NavGroup } from './navItems'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

// When the sidebar shows icons only: never (drawer), always (collapsed), or below lg (tablet rail).
type Compact = 'never' | 'always' | 'belowLg'

const labelClass: Record<Compact, string> = {
  never: '',
  always: 'sr-only',
  belowLg: 'sr-only lg:not-sr-only',
}

const itemLayoutClass: Record<Compact, string> = {
  never: '',
  always: 'justify-center',
  belowLg: 'justify-center lg:justify-start',
}

interface SidebarContentProps {
  groups: NavGroup[]
  compact: Compact
  onNavigate?: () => void
}

function SidebarContent({ groups, compact, onNavigate }: SidebarContentProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { user, clearAuth } = useAuth()

  async function handleLogout() {
    await clearAuth()
    navigate('/login')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3">
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <div
          className={cn(
            'flex min-h-11 items-center gap-3 px-2.5 font-display text-lg font-semibold text-primary',
            itemLayoutClass[compact],
          )}
        >
          <Plane className="h-5 w-5 shrink-0" />
          <span className={labelClass[compact]}>{t('appName')}</span>
        </div>
        {user && (
          <p className={cn('truncate px-2.5 text-sm text-muted-foreground', labelClass[compact])}>
            {t('nav.hello', { name: user.name ?? user.email })}
          </p>
        )}
      </div>

      <nav className="flex flex-col gap-3">
        {groups.map((group, i) => (
          <div
            key={i}
            className={cn('flex flex-col gap-1', i > 0 && 'border-t border-border pt-3')}
          >
            {group.heading && (
              <p
                className={cn(
                  'truncate px-2.5 pb-1 text-xs font-semibold text-muted-foreground',
                  labelClass[compact],
                )}
              >
                <bdi>{group.heading}</bdi>
              </p>
            )}
            {group.items.map(({ titleKey, title, url, icon: Icon, end }) => {
              const label = titleKey ? t(titleKey) : title
              return (
                <NavLink
                  key={url}
                  to={url}
                  end={end}
                  onClick={onNavigate}
                  title={compact === 'never' ? undefined : label}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center gap-3 rounded-md px-2.5 transition',
                      itemLayoutClass[compact],
                      isActive ? 'bg-primary/15 font-semibold text-primary' : 'hover:bg-primary/10',
                    )
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={cn('truncate', labelClass[compact])}>
                    {titleKey ? label : <bdi>{label}</bdi>}
                  </span>
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              title={compact === 'never' ? undefined : t('nav.logout')}
              className={cn(
                'flex min-h-11 w-full items-center gap-3 rounded-md px-2.5 text-start text-destructive transition hover:bg-destructive/10',
                itemLayoutClass[compact],
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className={labelClass[compact]}>{t('nav.logout')}</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('logoutDialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>{t('logoutDialog.description')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('logoutDialog.cancel')}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleLogout}>
                {t('logoutDialog.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

interface AppSidebarProps {
  groups: NavGroup[]
  collapsed: boolean
}

// Persistent sidebar for tablet (icon rail) and desktop (full, or rail when collapsed).
export function AppSidebar({ groups, collapsed }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        'glass-strong fixed inset-y-0 start-0 z-20 hidden h-dvh w-16 flex-col border-y-0 border-s-0 transition-[width] duration-300 md:flex',
        !collapsed && 'lg:w-64',
      )}
    >
      <SidebarContent groups={groups} compact={collapsed ? 'always' : 'belowLg'} />
    </aside>
  )
}

interface MobileSidebarProps {
  groups: NavGroup[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Slide-over drawer used below md.
export function MobileSidebar({ groups, open, onOpenChange }: MobileSidebarProps) {
  const { t } = useTranslation('common')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="md:hidden">
        <SheetTitle className="sr-only">{t('appName')}</SheetTitle>
        <SheetDescription className="sr-only">{t('nav.menu')}</SheetDescription>
        <SidebarContent groups={groups} compact="never" onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}
