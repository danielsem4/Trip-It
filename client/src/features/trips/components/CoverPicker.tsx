import { useEffect, useRef, useState } from 'react'
import { Check, ImagePlus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { COVER_COLORS, coverClass, type CoverColor } from '../lib/coverColors'

const COVER_MAX_BYTES = 4 * 1024 * 1024
const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface CoverPickerProps {
  color: string
  onColorChange: (color: CoverColor) => void
  /** Newly picked, not yet uploaded file. */
  file: File | null
  onFileChange: (file: File | null) => void
  /** Already-saved image URL (edit mode); null when none or marked for removal. */
  existingUrl: string | null
  onRemoveExisting: () => void
}

export function CoverPicker({
  color,
  onColorChange,
  file,
  onFileChange,
  existingUrl,
  onRemoveExisting,
}: Readonly<CoverPickerProps>) {
  const { t } = useTranslation('trips')
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewRef = useRef<string | null>(null)

  // Object URLs are created in handlers and revoked on replace/remove/unmount.
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
  }, [])

  function setPreview(next: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = next ? URL.createObjectURL(next) : null
    setPreviewUrl(previewRef.current)
  }

  const imageSrc = (file ? previewUrl : null) ?? existingUrl

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    if (!COVER_TYPES.includes(picked.type)) {
      setError(t('form.imageTypeError'))
      return
    }
    if (picked.size > COVER_MAX_BYTES) {
      setError(t('form.imageSizeError'))
      return
    }
    setError(null)
    setPreview(picked)
    onFileChange(picked)
  }

  function handleRemove() {
    setError(null)
    if (file) {
      setPreview(null)
      onFileChange(null)
    }
    else onRemoveExisting()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="h-24 w-full overflow-hidden rounded-lg border">
        {imageSrc ? (
          <img src={imageSrc} alt="" className="size-full object-cover" />
        ) : (
          <div aria-hidden className={cn('size-full', coverClass(color))} />
        )}
      </div>

      <div role="radiogroup" aria-label={t('form.coverColor')} className="grid grid-cols-8 gap-2">
        {COVER_COLORS.map((c) => {
          const selected = color === c
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={t(`form.colors.${c}`)}
              onClick={() => onColorChange(c)}
              className={cn(
                'focus-visible:ring-ring/50 flex aspect-square w-full items-center justify-center rounded-full text-white outline-none focus-visible:ring-[3px]',
                coverClass(c),
                selected && 'ring-foreground ring-offset-background ring-2 ring-offset-2',
              )}
            >
              {selected && <Check className="size-4" aria-hidden />}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={COVER_TYPES.join(',')}
          className="hidden"
          onChange={handleFile}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <ImagePlus />
          {imageSrc ? t('form.changeImage') : t('form.uploadImage')}
        </Button>
        {imageSrc && (
          <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
            <Trash2 />
            {t('form.removeImage')}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
