import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { BedDouble, Bus, MapPin, Pencil, PlaneTakeoff, Receipt, X, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { canEditTrip, tripPath, useTrip, type Trip } from '@/features/trips'
import {
  ItemSection,
  controlClass,
  currencyOptions,
  formatMoney,
  itemApi,
  useTripItemsQuery,
} from '@/features/tripItems'
import { sectionIcon, sectionSegment, useSectionsQuery, type Section } from '@/features/places'
import type { Budget } from './budget.api'
import { BudgetBar } from './BudgetBar'
import { expenseCard, expenseFields, type Expense } from './expenses.config'
import { useBudgetQuery, useRemoveRate, useSetRate, useUpdateBudgetSettings } from './useBudget'

const AMOUNT = /^\d{1,10}([.,]\d{1,2})?$/
const RATE = /^\d{1,6}([.,]\d{1,6})?$/
const toNumber = (raw: string) => Number(raw.trim().replace(',', '.'))

export function BudgetPage() {
  const trip = useTrip()
  const { t, i18n } = useTranslation('tripItems')
  const locale = i18n.resolvedLanguage ?? i18n.language
  const budgetQuery = useBudgetQuery(trip.id)
  const sectionsQuery = useSectionsQuery(trip.id)
  const expensesApi = useMemo(
    () => itemApi<Expense>(`/trips/${trip.id}/expenses`, 'expense', 'expenses'),
    [trip.id],
  )
  const expensesQuery = useTripItemsQuery(trip.id, 'expenses', expensesApi)

  if (budgetQuery.isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-muted-foreground">{t('common.loadFailed')}</p>
        <Button onClick={() => void budgetQuery.refetch()}>{t('common.retry')}</Button>
      </div>
    )
  }
  if (!budgetQuery.data) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner className="text-primary size-8" aria-label={t('common.loading')} />
      </div>
    )
  }
  const budget = budgetQuery.data

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h2 className="sr-only">{t('budget.title')}</h2>
      <SummaryCard trip={trip} budget={budget} />
      <RatesCard trip={trip} budget={budget} />
      <GroupsCard trip={trip} budget={budget} sections={sectionsQuery.data ?? []} />
      <ItemSection
        embedded
        trip={trip}
        scope="expenses"
        icon={Receipt}
        items={expensesQuery.data}
        isError={expensesQuery.isError}
        onRetry={() => void expensesQuery.refetch()}
        fields={expenseFields}
        api={expensesApi}
        toCard={(expense) => expenseCard(expense, locale)}
      />
    </div>
  )
}

interface CardProps {
  trip: Trip
  budget: Budget
}

function SummaryCard({ trip, budget }: Readonly<CardProps>) {
  const { t, i18n } = useTranslation('tripItems')
  const locale = i18n.resolvedLanguage ?? i18n.language
  const [open, setOpen] = useState(false)
  const money = (amount: number) => formatMoney(amount, budget.currency, locale)
  const { total, budgetAmount, remaining } = budget

  return (
    <section className="glass flex flex-col gap-3 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">{t('budget.planned')}</p>
          <p className="text-2xl font-bold break-words">
            {money(total)}
            {budgetAmount !== null && (
              <span className="text-muted-foreground text-base font-normal"> / {money(budgetAmount)}</span>
            )}
          </p>
        </div>
        {canEditTrip(trip) && (
          <Button variant="outline" className="shrink-0" onClick={() => setOpen(true)}>
            <Pencil aria-hidden />
            {t(budgetAmount === null ? 'budget.set' : 'budget.change')}
          </Button>
        )}
      </div>

      {budgetAmount !== null && remaining !== null ? (
        <>
          <BudgetBar total={total} budgetAmount={budgetAmount} label={t('budget.title')} />
          <p className={cn('text-sm font-medium', remaining < 0 ? 'text-destructive' : 'text-muted-foreground')}>
            {remaining < 0
              ? t('budget.over', { amount: money(-remaining) })
              : t('budget.remaining', { amount: money(remaining) })}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">{t('budget.noBudget')}</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('budget.settingsTitle')}</DialogTitle>
            <DialogDescription>{t('budget.settingsDescription')}</DialogDescription>
          </DialogHeader>
          <SettingsForm trip={trip} budget={budget} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </section>
  )
}

function SettingsForm({ trip, budget, onDone }: Readonly<CardProps & { onDone: () => void }>) {
  const { t } = useTranslation('tripItems')
  const update = useUpdateBudgetSettings(trip.id)
  const [amount, setAmount] = useState(budget.budgetAmount === null ? '' : String(budget.budgetAmount))
  const [currency, setCurrency] = useState(budget.currency)
  const [showError, setShowError] = useState(false)
  const invalid = amount.trim() !== '' && !AMOUNT.test(amount.trim())

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (invalid) {
      setShowError(true)
      return
    }
    update.mutate(
      { currency, budgetAmount: amount.trim() === '' ? null : toNumber(amount) },
      { onSuccess: onDone, onError: () => toast.error(t('common.saveFailed')) },
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="budget-amount">{t('budget.amount')}</Label>
        <div className="flex gap-2">
          <Input
            id="budget-amount"
            inputMode="decimal"
            dir="ltr"
            className="min-w-0 flex-1 text-start"
            value={amount}
            aria-invalid={showError && invalid}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select
            aria-label={t('budget.mainCurrency')}
            className={cn(controlClass, 'h-9 w-24 shrink-0')}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {currencyOptions(budget.currency).map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        {showError && invalid && (
          <p role="alert" className="text-destructive text-sm">
            {t('validation.amount')}
          </p>
        )}
        {currency !== budget.currency && budget.rates.length > 0 && (
          <p className="text-muted-foreground text-sm">{t('budget.currencyChangeNote')}</p>
        )}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onDone} disabled={update.isPending}>
          {t('common.cancel')}
        </Button>
        <LoadingButton type="submit" loading={update.isPending} loadingText={t('common.saving')}>
          {t('common.save')}
        </LoadingButton>
      </div>
    </form>
  )
}

// One row per foreign currency in use: those still missing a rate first.
function RatesCard({ trip, budget }: Readonly<CardProps>) {
  const { t, i18n } = useTranslation('tripItems')
  const locale = i18n.resolvedLanguage ?? i18n.language
  const canEdit = canEditTrip(trip)
  if (budget.unconverted.length === 0 && budget.rates.length === 0) return null

  return (
    <section className="glass flex flex-col gap-3 rounded-xl p-4">
      <div>
        <h3 className="text-base font-semibold">{t('budget.ratesTitle')}</h3>
        {budget.unconverted.length > 0 && (
          <p className="text-destructive text-sm">{t('budget.missingRates')}</p>
        )}
      </div>
      <ul className="flex flex-col gap-3">
        {budget.unconverted.map(({ currency, amount }) => (
          <RateRow
            key={currency}
            trip={trip}
            main={budget.currency}
            currency={currency}
            rate={null}
            note={t('budget.waiting', { amount: formatMoney(amount, currency, locale) })}
            canEdit={canEdit}
          />
        ))}
        {budget.rates.map(({ currency, rate }) => (
          <RateRow
            key={currency}
            trip={trip}
            main={budget.currency}
            currency={currency}
            rate={rate}
            canEdit={canEdit}
          />
        ))}
      </ul>
    </section>
  )
}

interface RateRowProps {
  trip: Trip
  main: string
  currency: string
  rate: number | null
  note?: string
  canEdit: boolean
}

function RateRow({ trip, main, currency, rate, note, canEdit }: Readonly<RateRowProps>) {
  const { t } = useTranslation('tripItems')
  const save = useSetRate(trip.id)
  const remove = useRemoveRate(trip.id)
  const [value, setValue] = useState(rate === null ? '' : String(rate))
  const valid = RATE.test(value.trim()) && toNumber(value) > 0
  const changed = rate === null || toNumber(value) !== rate
  const inputId = `rate-${currency}`

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    save.mutate(
      { currency, rate: toNumber(value) },
      { onError: () => toast.error(t('common.saveFailed')) },
    )
  }

  return (
    <li className="flex flex-col gap-1">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        {/* Always read left to right: "1 EUR = 4.05 ILS". */}
        <div dir="ltr" className="flex min-w-0 flex-1 items-center gap-2">
          <label htmlFor={inputId} className="shrink-0 text-sm font-medium">
            1 {currency} =
          </label>
          {canEdit ? (
            <Input
              id={inputId}
              inputMode="decimal"
              className="w-24 min-w-0"
              value={value}
              aria-label={t('budget.rateLabel', { currency, main })}
              onChange={(e) => setValue(e.target.value)}
            />
          ) : (
            <span className="text-sm font-medium">{rate ?? '?'}</span>
          )}
          <span className="shrink-0 text-sm font-medium">{main}</span>
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-1">
            <LoadingButton
              type="submit"
              variant={rate === null ? 'default' : 'outline'}
              disabled={!valid || !changed}
              loading={save.isPending}
            >
              {t('common.save')}
            </LoadingButton>
            {rate !== null && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={remove.isPending}
                aria-label={t('budget.removeRate', { currency })}
                onClick={() => remove.mutate(currency, { onError: () => toast.error(t('common.deleteFailed')) })}
              >
                <X aria-hidden />
              </Button>
            )}
          </div>
        )}
      </form>
      {note && <p className="text-muted-foreground text-sm">{note}</p>}
    </li>
  )
}

const GROUP_ICONS: Record<string, LucideIcon> = {
  flights: PlaneTakeoff,
  stays: BedDouble,
  transport: Bus,
  expenses: Receipt,
}

function GroupsCard({ trip, budget, sections }: Readonly<CardProps & { sections: Section[] }>) {
  const { t, i18n } = useTranslation('tripItems')
  const locale = i18n.resolvedLanguage ?? i18n.language
  if (budget.groups.length === 0) return null

  // A budget group is one of the fixed collections or a place section ("section:<id>").
  function describe(key: string): { label: string; user?: boolean; icon: LucideIcon; to?: string } {
    if (!key.startsWith('section:')) {
      return {
        label: t(`${key}.title`),
        icon: GROUP_ICONS[key] ?? MapPin,
        to: key === 'expenses' ? undefined : tripPath(trip.id, key),
      }
    }
    const section = sections.find((s) => `section:${s.id}` === key)
    if (!section) return { label: t('places.title'), icon: MapPin }
    return {
      label: section.name ?? t(`${sectionSegment(section)}.title`),
      user: section.name !== null,
      icon: sectionIcon(section),
      to: tripPath(trip.id, sectionSegment(section)),
    }
  }

  return (
    <section className="glass flex flex-col gap-3 rounded-xl p-4">
      <h3 className="text-base font-semibold">{t('budget.bySection')}</h3>
      <ul className="flex flex-col">
        {budget.groups.map(({ key, total, count }) => {
          const { label, user, icon: Icon, to } = describe(key)
          const name = user ? <bdi>{label}</bdi> : label
          return (
            <li key={key} className="border-border flex min-h-11 items-center gap-3 border-b py-2 last:border-b-0">
              <Icon className="text-primary size-5 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate">
                {to ? (
                  <Link to={to} className="hover:underline">
                    {name}
                  </Link>
                ) : (
                  name
                )}
                <span className="text-muted-foreground text-sm"> · {count}</span>
              </span>
              <span className="shrink-0 font-semibold">{formatMoney(total, budget.currency, locale)}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
