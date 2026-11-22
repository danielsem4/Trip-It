import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { cn } from '@/lib/utils'
import { SECTION_ICONS, type Section } from './places.config'
import type { SectionFormData } from './sections.api'

const NAME_MAX = 40

interface SectionFormProps {
  section?: Section
  saving: boolean
  onSubmit: (data: SectionFormData) => void
  onCancel: () => void
}

// Name + icon for a custom section; used to add one and to rename one.
export function SectionForm({ section, saving, onSubmit, onCancel }: Readonly<SectionFormProps>) {
  const { t } = useTranslation('tripItems')
  const [name, setName] = useState(section?.name ?? '')
  const [icon, setIcon] = useState(section?.icon ?? 'pin')
  const [showError, setShowError] = useState(false)
  const invalid = name.trim() === ''

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (invalid) {
      setShowError(true)
      return
    }
    onSubmit({ name: name.trim(), icon })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="section-name">{t('sections.name')}</Label>
        <Input
          id="section-name"
          value={name}
          maxLength={NAME_MAX}
          placeholder={t('sections.namePlaceholder')}
          aria-invalid={showError && invalid}
          onChange={(e) => setName(e.target.value)}
        />
        {showError && invalid && (
          <p role="alert" className="text-destructive text-sm">
            {t('validation.required')}
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t('sections.icon')}</legend>
        <div className="grid grid-cols-5 gap-2 min-[420px]:grid-cols-10 sm:grid-cols-5 md:grid-cols-10">
          {Object.entries(SECTION_ICONS).map(([key, Icon]) => (
            <label
              key={key}
              title={t(`sections.icons.${key}`)}
              className={cn(
                'has-focus-visible:ring-ring/50 flex aspect-square min-h-11 cursor-pointer items-center justify-center rounded-lg border transition has-focus-visible:ring-[3px]',
                icon === key ? 'border-primary bg-primary/15 text-primary' : 'glass-subtle hover:bg-primary/10',
              )}
            >
              <input
                type="radio"
                name="section-icon"
                value={key}
                checked={icon === key}
                onChange={() => setIcon(key)}
                className="sr-only"
                aria-label={t(`sections.icons.${key}`)}
              />
              <Icon className="size-5" aria-hidden />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <LoadingButton type="submit" loading={saving} loadingText={t('common.saving')}>
          {t(section ? 'common.save' : 'sections.create')}
        </LoadingButton>
      </div>
    </form>
  )
}
