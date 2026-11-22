import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { canEditTrip, type Trip } from '@/features/trips'
import type { ItemApi } from '../api/tripItems.api'
import { useDeleteTripItem, useSaveTripItem } from '../hooks/useTripItems'
import type { CardContent, FieldDef, ItemPayload } from '../types/tripItem.types'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'
import { ItemCard } from './ItemCard'
import { ItemFormDialog } from './ItemFormDialog'

interface ItemSectionProps<T extends { id: number }> {
  trip: Trip
  // Translation scope inside `tripItems` (title, add, edit, empty, fields...).
  scope: string
  fieldScope?: string
  // Overrides the scope's title, for user-named sections.
  title?: string
  icon: LucideIcon
  items: T[] | undefined
  isError: boolean
  onRetry: () => void
  fields: FieldDef[]
  api: Pick<ItemApi<T>, 'create' | 'update' | 'remove'>
  toCard: (item: T) => CardContent
  renderLeading?: (item: T) => ReactNode
  isMuted?: (item: T) => boolean
  // Extra controls next to the title (e.g. rename / delete the section).
  actions?: ReactNode
  // A block inside another page: smaller heading and no floating add button.
  embedded?: boolean
}

// A list of one kind of trip item with add / edit / delete, shared by every section page.
export function ItemSection<T extends { id: number }>({
  trip,
  scope,
  fieldScope,
  title,
  icon: Icon,
  items,
  isError,
  onRetry,
  fields,
  api,
  toCard,
  renderLeading,
  isMuted,
  actions,
  embedded,
}: Readonly<ItemSectionProps<T>>) {
  const { t } = useTranslation('tripItems')
  const canEdit = canEditTrip(trip)
  const save = useSaveTripItem(trip.id, api)
  const remove = useDeleteTripItem(trip.id, api)
  // null = closed, 'new' = adding, otherwise the item being edited.
  const [editing, setEditing] = useState<T | 'new' | null>(null)
  const [deleting, setDeleting] = useState<T | null>(null)

  const heading = title ?? t(`${scope}.title`)
  const Heading = embedded ? 'h3' : 'h2'

  function handleSubmit(data: ItemPayload) {
    const id = editing === 'new' || editing === null ? null : editing.id
    save.mutate(
      { id, data },
      {
        onSuccess: () => setEditing(null),
        onError: () => toast.error(t('common.saveFailed')),
      },
    )
  }

  function handleDelete() {
    if (!deleting) return
    remove.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
      onError: () => {
        setDeleting(null)
        toast.error(t('common.deleteFailed'))
      },
    })
  }

  let body: ReactNode
  if (isError) {
    body = (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-muted-foreground">{t('common.loadFailed')}</p>
        <Button onClick={onRetry}>{t('common.retry')}</Button>
      </div>
    )
  } else if (!items) {
    body = (
      <div className="flex justify-center py-10">
        <Spinner className="text-primary size-8" aria-label={t('common.loading')} />
      </div>
    )
  } else if (items.length === 0) {
    body = (
      <div className="glass flex flex-col items-center gap-3 rounded-xl px-4 py-10 text-center">
        <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
          <Icon className="size-7" aria-hidden />
        </div>
        <p className="text-muted-foreground text-balance">{t(`${scope}.empty`)}</p>
        {canEdit && (
          <Button onClick={() => setEditing('new')}>
            <Plus aria-hidden />
            {t(`${scope}.add`)}
          </Button>
        )}
      </div>
    )
  } else {
    body = (
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            content={toCard(item)}
            leading={renderLeading?.(item)}
            muted={isMuted?.(item)}
            onEdit={canEdit ? () => setEditing(item) : undefined}
            onDelete={canEdit ? () => setDeleting(item) : undefined}
          />
        ))}
      </ul>
    )
  }

  const showFab = canEdit && !embedded && !!items?.length

  return (
    <section className={cn('flex w-full flex-col gap-4', !embedded && 'mx-auto max-w-3xl', showFab && 'pb-20 md:pb-0')}>
      {/* A full page is already named by the app header, so its own heading is for screen readers
          and the row only shows when it has controls. */}
      <div
        className={cn(
          'min-h-9 items-center justify-between gap-2',
          embedded || actions ? 'flex' : 'hidden md:flex',
        )}
      >
        <Heading className={cn('min-w-0 truncate font-semibold', embedded ? 'text-base' : 'sr-only')}>
          {title ? <bdi>{heading}</bdi> : heading}
        </Heading>
        <div className="ms-auto flex shrink-0 items-center gap-1">
          {actions}
          {canEdit && !!items?.length && (
            <Button
              variant={embedded ? 'outline' : 'default'}
              className={cn(!embedded && 'hidden md:inline-flex')}
              onClick={() => setEditing('new')}
            >
              <Plus aria-hidden />
              {t(`${scope}.add`)}
            </Button>
          )}
        </div>
      </div>

      {body}

      {showFab && (
        <button
          type="button"
          onClick={() => setEditing('new')}
          aria-label={t(`${scope}.add`)}
          className="bg-primary text-primary-foreground focus-visible:ring-ring/50 fixed end-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full shadow-lg outline-none transition-transform focus-visible:ring-[3px] active:scale-95 md:hidden"
        >
          <Plus className="size-6" aria-hidden />
        </button>
      )}

      {canEdit && (
        <>
          <ItemFormDialog
            open={editing !== null}
            onOpenChange={(open) => !open && setEditing(null)}
            scope={scope}
            fieldScope={fieldScope}
            fields={fields}
            item={editing === 'new' || editing === null ? undefined : (editing as Record<string, unknown>)}
            tripCurrency={trip.currency}
            saving={save.isPending}
            onSubmit={handleSubmit}
          />
          <ConfirmDeleteDialog
            open={deleting !== null}
            onOpenChange={(open) => !open && setDeleting(null)}
            title={t('common.deleteTitle')}
            description={t('common.deleteDescription', { title: deleting ? toCard(deleting).title : '' })}
            pending={remove.isPending}
            onConfirm={handleDelete}
          />
        </>
      )}
    </section>
  )
}
