export type { Trip, TripMember, TripRole, TripStatus } from './types/trip.types'
export { tripFormSchema } from './schemas/trip.schema'
export type { TripFormData } from './schemas/trip.schema'
export { COVER_COLORS, coverClass } from './lib/coverColors'
export type { CoverColor } from './lib/coverColors'
export {
  todayISO,
  tripStatus,
  groupTrips,
  pickHeroTrip,
  daysUntil,
  tripDayProgress,
  formatTripDates,
} from './lib/tripDates'
export {
  tripKeys,
  useTripsQuery,
  useTripQuery,
  useCreateTrip,
  useUpdateTrip,
  useDeleteTrip,
  useUploadTripCover,
  useRemoveTripCover,
} from './hooks/useTrips'
export { useTripCountdown } from './hooks/useTripCountdown'
export { TripDetailsPage } from './pages/TripDetailsPage'
