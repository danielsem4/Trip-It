import type { Trip } from '../types/trip.types'
import { coverClass } from '../lib/coverColors'
import { cn } from '@/lib/utils'

interface TripCoverProps {
  trip: Pick<Trip, 'coverColor' | 'coverImageUrl'>
  className?: string
}

export function TripCover({ trip, className }: Readonly<TripCoverProps>) {
  if (trip.coverImageUrl) {
    return (
      <img
        src={trip.coverImageUrl}
        alt=""
        loading="lazy"
        className={cn('size-full object-cover', className)}
      />
    )
  }
  return <div aria-hidden className={cn('size-full', coverClass(trip.coverColor), className)} />
}
