const MAX_TRIP_ID = 2_147_483_647 // Postgres INT4

export function parseTripId(raw: string | undefined): number | null {
  if (!raw || !/^[1-9]\d*$/.test(raw)) return null
  const id = Number(raw)
  return Number.isSafeInteger(id) && id <= MAX_TRIP_ID ? id : null
}
