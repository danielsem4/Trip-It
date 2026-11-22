import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import { tripFormSchema, type TripFormData } from '../schemas/trip.schema'
import { uploadTripCover } from '../api/trips.api'
import { tripKeys, useCreateTrip, useUpdateTrip, useRemoveTripCover } from '../hooks/useTrips'
import type { Trip } from '../types/trip.types'
import { CoverPicker } from './CoverPicker'

interface TripFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trip?: Trip
}

export function TripFormDialog({ open, onOpenChange, trip }: Readonly<TripFormDialogProps>) {
  const { t } = useTranslation('trips')
  const isEdit = trip !== undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t('form.editTitle') : t('form.createTitle')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('form.editDescription') : t('form.createDescription')}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form state resets on every open. */}
        <TripForm trip={trip} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function TripForm({ trip, onDone }: Readonly<{ trip?: Trip; onDone: () => void }>) {
  const { t } = useTranslation('trips')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createTrip = useCreateTrip()
  const updateTrip = useUpdateTrip(trip?.id ?? 0)
  const removeCover = useRemoveTripCover(trip?.id ?? 0)
  const [file, setFile] = useState<File | null>(null)
  const [removeExisting, setRemoveExisting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      title: trip?.title ?? '',
      destination: trip?.destination ?? '',
      startDate: trip?.startDate ?? '',
      endDate: trip?.endDate ?? null,
      coverColor: trip?.coverColor ?? 'sky',
    } as TripFormData,
  })
  const coverColor = useWatch({ control, name: 'coverColor' })

  async function onSubmit(data: TripFormData) {
    const payload: TripFormData = { ...data, endDate: data.endDate || null }
    setSubmitting(true)
    try {
      if (trip) {
        await updateTrip.mutateAsync(payload)
      } else {
        const created = await createTrip.mutateAsync(payload)
        if (file) {
          try {
            await uploadTripCover(created.id, file)
            await queryClient.invalidateQueries({ queryKey: tripKeys.all })
          } catch {
            toast.error(t('form.coverFailed'))
          }
        }
        onDone()
        navigate(`/trips/${created.id}`)
        return
      }
    } catch {
      toast.error(trip ? t('form.updateFailed') : t('form.createFailed'))
      setSubmitting(false)
      return
    }

    // Edit mode: cover image changes after the fields were saved.
    try {
      if (trip) {
        if (file) await uploadTripCover(trip.id, file)
        else if (removeExisting && trip.coverImageUrl) await removeCover.mutateAsync()
        if (file) await queryClient.invalidateQueries({ queryKey: tripKeys.all })
      }
    } catch {
      toast.error(t('form.coverFailed'))
    }
    onDone()
  }

  const err = (message?: string) => (message ? t(message) : undefined)

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="trip-title">{t('form.title')}</Label>
        <Input
          id="trip-title"
          maxLength={100}
          placeholder={t('form.titlePlaceholder')}
          aria-invalid={!!errors.title}
          {...register('title')}
        />
        {errors.title && <FieldError>{err(errors.title.message)}</FieldError>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="trip-destination">{t('form.destination')}</Label>
        <Input
          id="trip-destination"
          maxLength={100}
          placeholder={t('form.destinationPlaceholder')}
          aria-invalid={!!errors.destination}
          {...register('destination')}
        />
        {errors.destination && <FieldError>{err(errors.destination.message)}</FieldError>}
      </div>

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="trip-start">{t('form.startDate')}</Label>
          <Input
            id="trip-start"
            type="date"
            aria-invalid={!!errors.startDate}
            {...register('startDate')}
          />
          {errors.startDate && <FieldError>{err(errors.startDate.message)}</FieldError>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="trip-end">{t('form.endDate')}</Label>
          <Input
            id="trip-end"
            type="date"
            aria-invalid={!!errors.endDate}
            {...register('endDate', { setValueAs: (v: string) => (v ? v : null) })}
          />
          {errors.endDate && <FieldError>{err(errors.endDate.message)}</FieldError>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t('form.cover')}</Label>
        <CoverPicker
          color={coverColor}
          onColorChange={(c) => setValue('coverColor', c, { shouldDirty: true })}
          file={file}
          onFileChange={setFile}
          existingUrl={removeExisting ? null : (trip?.coverImageUrl ?? null)}
          onRemoveExisting={() => setRemoveExisting(true)}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onDone} disabled={submitting}>
          {t('form.cancel')}
        </Button>
        <LoadingButton type="submit" loading={submitting} loadingText={t('form.saving')}>
          {trip ? t('form.save') : t('form.create')}
        </LoadingButton>
      </div>
    </form>
  )
}

function FieldError({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p role="alert" className="text-destructive text-sm">
      {children}
    </p>
  )
}
