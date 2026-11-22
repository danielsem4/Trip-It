import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { List, MapPinned, Maximize2, Navigation, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { tripPath } from '@/features/trips'
import { ItemCard } from '@/features/tripItems'
import { stayCard, stayIcon } from '@/features/stays'
import { placeCard, sectionIcon } from '@/features/places'
import { transportCard, transportIcon } from '@/features/transport'
import { buildPins, directionsUrl, type MapPin, type PinSources, type PinTone } from './mapPins'
import { useMyLocation } from './useMyLocation'
import { useTripMapQuery } from './useTripMap'

// Leaflet is only downloaded when a map is actually shown.
const TripMapView = lazy(() => import('./TripMapView'))

const TONES: PinTone[] = ['stay', 'attractions', 'restaurants', 'custom', 'transport']
const TONE_LABEL: Record<PinTone, string> = {
  stay: 'stays.title',
  attractions: 'attractions.title',
  restaurants: 'restaurants.title',
  custom: 'map.otherPlaces',
  transport: 'transport.title',
}

interface TripMapCardProps extends Partial<PinSources> {
  tripId: number
}

// The trip's area with a dot per saved stay, place and transport stop. Tapping a dot shows
// that item's card; the map also opens full screen.
export function TripMapCard({ tripId, stays, sections, transport }: Readonly<TripMapCardProps>) {
  const { t, i18n } = useTranslation('tripItems')
  const locale = i18n.resolvedLanguage ?? i18n.language
  const { data: map } = useTripMapQuery(tripId)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [fullScreen, setFullScreen] = useState(false)

  const pins = useMemo(
    () =>
      buildPins(
        map?.points ?? [],
        { stays: stays ?? [], sections: sections ?? [], transport: transport ?? [] },
        {
          stay: (stay) => stayCard(stay, t, locale),
          place: (place) => placeCard(place, t, locale),
          transport: (item) => transportCard(item, t, locale),
          stayIcon: (stay) => stayIcon(stay.type),
          sectionIcon,
          transportIcon: (item) => transportIcon(item.type),
        },
      ),
    [map?.points, stays, sections, transport, t, locale],
  )

  // Nothing to centre on and nothing on the way: no map to show.
  const shown = !!map && (!!map.area || pins.length > 0 || map.pending > 0)
  // Only asks where the user is when there's a map to show it on.
  const me = useMyLocation(shown)
  if (!map || !shown) return null

  const selected = pins.find((pin) => pin.key === selectedKey) ?? null
  const tones = TONES.filter((tone) => pins.some((pin) => pin.tone === tone))
  const view = {
    pins,
    area: map.area,
    selectedKey: selected?.key ?? null,
    onSelect: setSelectedKey,
    me: me.position,
    label: t('map.label'),
    meLabel: t('map.youAreHere'),
    locateLabel: t('map.locate'),
  }
  const pinCard = selected && (
    <PinCard pin={selected} to={tripPath(tripId, selected.segment)} onClose={() => setSelectedKey(null)} />
  )

  return (
    <section aria-labelledby="trip-map-title" className="glass flex flex-col gap-3 rounded-xl p-4">
      <div className="flex items-center gap-2">
        <MapPinned className="text-primary size-5 shrink-0" aria-hidden />
        <h2 id="trip-map-title" className="min-w-0 flex-1 truncate font-medium">
          {t('map.title')}
        </h2>
        <Button variant="ghost" size="icon" onClick={() => setFullScreen(true)} aria-label={t('map.expand')}>
          <Maximize2 aria-hidden />
        </Button>
      </div>

      <div className="bg-muted h-56 overflow-hidden rounded-lg sm:h-72">
        {/* One live map at a time: the small one steps aside while the full-screen one is open. */}
        {!fullScreen && (
          <Suspense fallback={<MapFallback />}>
            <TripMapView {...view} className="size-full" />
          </Suspense>
        )}
      </div>

      {tones.length > 0 && (
        <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {tones.map((tone) => (
            <li key={tone} className="flex items-center gap-1.5">
              <span className="trip-map-key" data-tone={tone} aria-hidden />
              {t(TONE_LABEL[tone])}
            </li>
          ))}
        </ul>
      )}

      <p role="status" className="text-muted-foreground text-sm empty:hidden">
        {map.pending > 0 ? t('map.locating') : pins.length === 0 ? t('map.empty') : null}
      </p>

      {(me.status === 'denied' || me.status === 'unavailable') && (
        <p className="text-muted-foreground text-xs">{t('map.locationOff')}</p>
      )}

      {!fullScreen && pinCard}

      <Dialog open={fullScreen} onOpenChange={setFullScreen}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="inset-0 flex h-dvh max-h-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:inset-0 sm:max-w-none sm:translate-y-0 sm:rounded-none sm:p-0 sm:ltr:translate-x-0 sm:rtl:translate-x-0"
        >
          <div className="flex items-center gap-2 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <MapPinned className="text-primary size-5 shrink-0" aria-hidden />
            <DialogTitle className="min-w-0 flex-1 truncate text-base">{t('map.title')}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" aria-label={t('map.closeMap')}>
                <X aria-hidden />
              </Button>
            </DialogClose>
          </div>
          <div className="bg-muted relative min-h-0 flex-1">
            <Suspense fallback={<MapFallback />}>
              <TripMapView {...view} interactive className="size-full" />
            </Suspense>
            {pinCard && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="bg-background/85 pointer-events-auto max-h-[55dvh] w-full max-w-lg overflow-y-auto rounded-2xl p-2 shadow-lg backdrop-blur">
                  {pinCard}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function MapFallback() {
  return <div className="bg-muted size-full animate-pulse" />
}

interface PinCardProps {
  pin: MapPin
  to: string
  onClose: () => void
}

// The item's own card, read-only, with a way to its list, a route to it and a way to put it away.
function PinCard({ pin, to, onClose }: Readonly<PinCardProps>) {
  const { t } = useTranslation('tripItems')
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to={to}>
              <List aria-hidden />
              {t('map.showInList')}
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={directionsUrl(pin.routeTo)} target="_blank" rel="noopener noreferrer">
              <Navigation aria-hidden />
              {t('map.route')}
            </a>
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('map.closeCard')}>
          <X aria-hidden />
        </Button>
      </div>
      <ul>
        <ItemCard content={pin.content} />
      </ul>
    </div>
  )
}
