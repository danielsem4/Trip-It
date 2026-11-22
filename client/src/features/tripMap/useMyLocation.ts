import { useEffect, useState } from 'react'

export interface MyPosition {
  lat: number
  lng: number
  // Radius in metres the device is confident about.
  accuracy: number
}

// 'denied': the user said no. 'unavailable': no location support, or the device can't tell.
export type LocationStatus = 'pending' | 'on' | 'denied' | 'unavailable'

interface MyLocation {
  position: MyPosition | null
  status: LocationStatus
}

const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator

// Follows the device's location while `enabled`. The browser asks for permission the first time.
export function useMyLocation(enabled: boolean): MyLocation {
  const [location, setLocation] = useState<MyLocation>({
    position: null,
    status: supported ? 'pending' : 'unavailable',
  })

  useEffect(() => {
    if (!enabled || !supported) return
    const watch = navigator.geolocation.watchPosition(
      ({ coords }) =>
        setLocation({
          position: { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy },
          status: 'on',
        }),
      (error) =>
        setLocation((last) => {
          if (error.code === error.PERMISSION_DENIED) return { position: null, status: 'denied' }
          // A passing glitch keeps the last known spot.
          return last.position ? last : { position: null, status: 'unavailable' }
        }),
      { enableHighAccuracy: true, maximumAge: 10_000 },
    )
    return () => navigator.geolocation.clearWatch(watch)
  }, [enabled])

  return location
}
