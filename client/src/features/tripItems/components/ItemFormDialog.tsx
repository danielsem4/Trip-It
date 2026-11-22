import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { cn } from '@/lib/utils'
import { currencyOptions } from '../lib/currencies'
import { buildSchema, defaultValues, toPayload } from '../lib/itemForm'
import type { FieldDef, FormValues, ItemPayload } from '../types/tripItem.types'

export const controlClass =
  'glass-subtle w-full min-w-0 rounded-md border px-3 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive md:text-sm'

interface ItemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Translation scope inside `tripItems`, e.g. 'flights'.
  scope: string
  // Where the field labels live, when several scopes share one set of fields.
  fieldScope?: string
  fields: FieldDef[]
  item?: Record<string, unknown>
  tripCurrency: string
  saving: boolean
  onSubmit: (data: ItemPayload) => void
}

export function ItemFormDialog({ open, onOpenChange, scope, item, ...form }: Readonly<ItemFormDialogProps>) {
  const { t } = useTranslation('tripItems')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(item ? `${scope}.edit` : `${scope}.add`)}</DialogTitle>
          <DialogDescription className="sr-only">{t(`${scope}.title`)}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form state resets on every open. */}
        <ItemForm scope={scope} item={item} onCancel={() => onOpenChange(false)} {...form} />
      </DialogContent>
    </Dialog>
  )
}

type ItemFormProps = Omit<ItemFormDialogProps, 'open' | 'onOpenChange'> & { onCancel: () => void }

function ItemForm({
  scope,
  fieldScope = scope,
  fields,
  item,
  tripCurrency,
  saving,
  onSubmit,
  onCancel,
}: Readonly<ItemFormProps>) {
  const { t } = useTranslation('tripItems')
  const schema = useMemo(() => buildSchema(fields), [fields])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(fields, item, tripCurrency),
  })

  const label = (name: string) => t(`${fieldScope}.fields.${name}`)
  const id = (name: string) => `item-${scope}-${name}`
  const errorOf = (name: string) => {
    const message = errors[name]?.message
    return message ? (
      <p role="alert" className="text-destructive text-sm">
        {t(message)}
      </p>
    ) : null
  }

  function renderField(field: FieldDef) {
    if (field.kind === 'price') {
      const currencies = currencyOptions(tripCurrency, item?.['priceCurrency'] as string | null)
      return (
        <div key="price" className="col-span-2 flex flex-col gap-2">
          <Label htmlFor={id('priceAmount')}>{t('common.price')}</Label>
          <div className="flex gap-2">
            <Input
              id={id('priceAmount')}
              inputMode="decimal"
              dir="ltr"
              className="min-w-0 flex-1 text-start"
              placeholder="0"
              aria-invalid={!!errors['priceAmount']}
              {...register('priceAmount')}
            />
            <select
              aria-label={t('common.currency')}
              className={cn(controlClass, 'h-9 w-24 shrink-0')}
              {...register('priceCurrency')}
            >
              {currencies.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          {errorOf('priceAmount')}
        </div>
      )
    }

    const { name } = field
    const half = 'half' in field && field.half
    const common = { id: id(name), 'aria-invalid': !!errors[name], ...register(name) }
    return (
      <div key={name} className={cn('flex flex-col gap-2', half ? 'col-span-2 min-[360px]:col-span-1' : 'col-span-2')}>
        <Label htmlFor={id(name)}>{label(name)}</Label>
        {field.kind === 'textarea' ? (
          <textarea rows={3} className={cn(controlClass, 'py-2')} {...common} />
        ) : field.kind === 'select' ? (
          <select className={cn(controlClass, 'h-9')} {...common}>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {t(`${fieldScope}.options.${name}.${option}`)}
              </option>
            ))}
          </select>
        ) : field.kind === 'url' ? (
          <Input type="url" inputMode="url" dir="ltr" className="text-start" placeholder="https://" {...common} />
        ) : (
          <Input type={field.kind} {...common} />
        )}
        {errorOf(name)}
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(toPayload(fields, values)))}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-4">{fields.map(renderField)}</div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <LoadingButton type="submit" loading={saving} loadingText={t('common.saving')}>
          {t('common.save')}
        </LoadingButton>
      </div>
    </form>
  )
}
