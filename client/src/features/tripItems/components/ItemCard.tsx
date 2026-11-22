import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatPrice } from '../lib/format'
import type { CardContent } from '../types/tripItem.types'

interface ItemCardProps {
  content: CardContent
  // Shown before the text, e.g. a "visited" checkbox.
  leading?: ReactNode
  muted?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function ItemCard({ content, leading, muted, onEdit, onDelete }: Readonly<ItemCardProps>) {
  const { t, i18n } = useTranslation('tripItems')
  const { title, image, badge, lines, links = [], notes, price } = content
  // A photo that fails to load leaves no gap: the card falls back to text only.
  const [brokenImage, setBrokenImage] = useState<string | null>(null)
  const priceText = price ? formatPrice(price, i18n.resolvedLanguage ?? i18n.language) : null

  return (
    <li className="glass flex gap-3 rounded-xl p-4">
      {leading}
      {image && image !== brokenImage && (
        <img
          src={image}
          alt=""
          loading="lazy"
          onError={() => setBrokenImage(image)}
          className={cn('size-16 shrink-0 rounded-lg object-cover', muted && 'opacity-60')}
        />
      )}
      <div className={cn('flex min-w-0 flex-1 flex-col gap-2', muted && 'opacity-60')}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 font-semibold break-words">
            <bdi>{title}</bdi>
          </h3>
          {badge && (
            <span className="bg-secondary text-secondary-foreground shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
              {badge}
            </span>
          )}
        </div>

        {lines.length > 0 && (
          <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
            {lines.map(({ icon: Icon, text, user }, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="min-w-0 break-words">{user ? <bdi>{text}</bdi> : text}</span>
              </li>
            ))}
          </ul>
        )}

        {notes && (
          <p className="text-sm break-words whitespace-pre-line">
            <bdi>{notes}</bdi>
          </p>
        )}

        {links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map(({ label, url }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:bg-primary/10 border-primary/30 inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium"
              >
                <ExternalLink className="size-3.5" aria-hidden />
                {label}
              </a>
            ))}
          </div>
        )}

        {(priceText || onEdit || onDelete) && (
          <div className="flex min-h-9 items-center justify-between gap-2">
            <span className="font-semibold">{priceText}</span>
            <div className="flex gap-1">
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={onEdit} aria-label={t('common.editItem', { title })}>
                  <Pencil aria-hidden />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={onDelete}
                  aria-label={t('common.deleteItem', { title })}
                >
                  <Trash2 aria-hidden />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  )
}
