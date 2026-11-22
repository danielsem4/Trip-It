import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { type Theme, useThemeStore } from '@/stores/useThemeStore'
import { cn } from '@/lib/utils'

const languages = [
  { code: 'he', label: 'עברית' },
  { code: 'en', label: 'English' },
] as const

const themes: Theme[] = ['light', 'dark', 'system']

export function SettingsPage() {
  const { t, i18n } = useTranslation('settings')
  const { user } = useAuth()
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 sm:gap-8">
      <Section title={t('profile.title')}>
        {user && (
          <dl className="glass grid gap-4 rounded-xl p-4 sm:grid-cols-3 sm:p-5">
            <ProfileField label={t('profile.name')} value={user.name ?? '—'} />
            <ProfileField label={t('profile.email')} value={user.email} />
            <ProfileField label={t('profile.role')} value={t(`profile.roles.${user.role}`)} />
          </dl>
        )}
      </Section>

      <Section title={t('appearance')}>
        <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:gap-4">
          {themes.map((value) => (
            <ThemeCard
              key={value}
              value={value}
              label={t(`themes.${value}`)}
              selected={theme === value}
              onSelect={setTheme}
            />
          ))}
        </div>
      </Section>

      <Section title={t('language')}>
        <select
          value={i18n.resolvedLanguage}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="glass-subtle h-11 w-full rounded-md border px-3 text-base focus:ring-2 sm:max-w-xs md:h-9 md:text-sm focus:ring-ring focus:outline-none"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 border-b border-border pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  )
}

function ThemeCard({
  value,
  label,
  selected,
  onSelect,
}: {
  value: Theme
  label: string
  selected: boolean
  onSelect: (theme: Theme) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className="flex min-w-0 flex-col items-center gap-2"
    >
      <div
        className={cn(
          'relative aspect-[7/5] w-full overflow-hidden rounded-xl border-2 transition-colors sm:aspect-auto sm:h-20 sm:w-28',
          selected ? 'border-primary' : 'border-border hover:border-muted-foreground',
        )}
      >
        <ThemePreview value={value} />
        {selected && (
          <div className="absolute end-1.5 bottom-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
      </div>
      <span className={cn('text-sm', selected && 'font-semibold')}>{label}</span>
    </button>
  )
}

function ThemePreview({ value }: { value: Theme }) {
  if (value === 'system') {
    return (
      <div className="flex h-full w-full">
        <div className="w-1/2 overflow-hidden">
          <MiniWindow dark={false} className="w-[200%]" />
        </div>
        <div className="w-1/2 overflow-hidden">
          <MiniWindow dark className="w-[200%]" />
        </div>
      </div>
    )
  }
  return <MiniWindow dark={value === 'dark'} />
}

function MiniWindow({ dark, className }: { dark: boolean; className?: string }) {
  return (
    <div dir="ltr" className={cn('flex h-full w-full gap-1.5 p-2', dark ? 'bg-slate-800' : 'bg-slate-100', className)}>
      <div className={cn('w-5 rounded-sm', dark ? 'bg-slate-700' : 'bg-white')} />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className={cn('h-2 rounded-sm', dark ? 'bg-slate-600' : 'bg-slate-300')} />
        <div className={cn('h-2 w-2/3 rounded-sm', dark ? 'bg-slate-600' : 'bg-slate-300')} />
        <div className="h-3 w-1/2 rounded-sm bg-sky-500" />
      </div>
    </div>
  )
}
