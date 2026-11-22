import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import L from 'leaflet'
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvent } from 'react-leaflet'
import { LocateFixed } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MapArea } from './tripMap.api'
import type { MapPin } from './mapPins'
import type { MyPosition } from './useMyLocation'

interface TripMapViewProps {
  pins: MapPin[]
  area: MapArea | null
  selectedKey: string | null
  onSelect: (key: string | null) => void
  // The full-screen map. The small one doesn't zoom on scroll, and on touch screens doesn't
  // pan either, so it never traps the page's own scrolling.
  interactive?: boolean
  // Where the user is, once the device has said.
  me?: MyPosition | null
  label: string
  meLabel: string
  locateLabel: string
  className?: string
}

// An empty box whose bottom centre, the pin's tip, sits on the coordinate. It never changes,
// so Leaflet never rebuilds the element the pin is drawn into. See `.trip-map-pin` in index.css.
const PIN_BOX = L.divIcon({ className: 'trip-map-pin', html: '', iconSize: [40, 48], iconAnchor: [20, 48] })

// The "you are here" dot, centred on the coordinate. See `.trip-map-me` in index.css.
const ME_BOX = L.divIcon({ className: 'trip-map-me', html: '', iconSize: [18, 18], iconAnchor: [9, 9] })
const ME_ZOOM = 16

// The user's own spot and how sure the device is of it. Not a pin: it can't be selected.
function MeMarker({ me, label }: Readonly<{ me: MyPosition; label: string }>) {
  return (
    <>
      <Circle
        center={[me.lat, me.lng]}
        radius={me.accuracy}
        interactive={false}
        pathOptions={{ color: '#2563eb', weight: 1, opacity: 0.4, fillOpacity: 0.1 }}
      />
      <Marker
        position={[me.lat, me.lng]}
        icon={ME_BOX}
        title={label}
        interactive={false}
        keyboard={false}
        zIndexOffset={500}
      />
    </>
  )
}

interface PinMarkerProps {
  pin: MapPin
  selected: boolean
  onSelect: (key: string) => void
}

function PinMarker({ pin, selected, onSelect }: Readonly<PinMarkerProps>) {
  const marker = useRef<L.Marker>(null)
  const [box, setBox] = useState<HTMLElement | null>(null)
  // The marker is on the map by the time this runs.
  useEffect(() => setBox(marker.current?.getElement() ?? null), [])
  const Icon = pin.icon

  return (
    <Marker
      ref={marker}
      position={[pin.lat, pin.lng]}
      icon={PIN_BOX}
      title={pin.title}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{ click: () => onSelect(pin.key) }}
    >
      {box &&
        createPortal(
          <span className="trip-map-pin-body" data-tone={pin.tone} data-selected={selected || undefined}>
            <Icon aria-hidden />
          </span>,
          box,
        )}
    </Marker>
  )
}

// Shows all the pins, or the destination's area while there are none.
function FitToTrip({ pins, area }: Readonly<Pick<TripMapViewProps, 'pins' | 'area'>>) {
  const map = useMap()
  useEffect(() => {
    if (pins.length > 0) {
      map.fitBounds(
        pins.map((p) => [p.lat, p.lng] as [number, number]),
        { padding: [36, 36], maxZoom: 15, animate: false },
      )
    } else if (area?.bbox) {
      const [south, north, west, east] = area.bbox
      map.fitBounds(
        [
          [south, west],
          [north, east],
        ],
        { animate: false },
      )
    } else if (area) {
      map.setView([area.lat, area.lng], 11, { animate: false })
    }
  }, [map, pins, area])
  return null
}

// Leaflet measures its container once; a dialog that animates in needs a re-measure.
function KeepSized() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

function DeselectOnMapClick({ onSelect }: Readonly<Pick<TripMapViewProps, 'onSelect'>>) {
  useMapEvent('click', () => onSelect(null))
  return null
}

export default function TripMapView({
  pins,
  area,
  selectedKey,
  onSelect,
  interactive = false,
  me = null,
  label,
  meLabel,
  locateLabel,
  className,
}: Readonly<TripMapViewProps>) {
  const map = useRef<L.Map>(null)
  const canPan = interactive || !L.Browser.mobile
  return (
    // `isolate` keeps Leaflet's own z-indexes below the app's dialogs and drawer.
    <div dir="ltr" role="region" aria-label={label} className={cn('relative isolate', className)}>
      <MapContainer
        ref={map}
        center={[area?.lat ?? 0, area?.lng ?? 0]}
        zoom={area ? 11 : 1}
        scrollWheelZoom={interactive}
        dragging={canPan}
        touchZoom={canPan}
        className="size-full"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <FitToTrip pins={pins} area={area} />
        <KeepSized />
        <DeselectOnMapClick onSelect={onSelect} />
        {pins.map((pin) => (
          <PinMarker key={pin.key} pin={pin} selected={pin.key === selectedKey} onSelect={onSelect} />
        ))}
        {me && <MeMarker me={me} label={meLabel} />}
      </MapContainer>
      {/* Outside the map's own element, so pressing it never reaches the map. The map opens on
          the trip, not on the user: this is the way to where they are. */}
      <Button
        variant="secondary"
        size="icon"
        disabled={!me}
        onClick={() => me && map.current?.flyTo([me.lat, me.lng], Math.max(map.current.getZoom(), ME_ZOOM))}
        aria-label={locateLabel}
        title={locateLabel}
        className="absolute top-2.5 right-2.5 z-[1000] size-10 shadow-md"
      >
        <LocateFixed aria-hidden />
      </Button>
    </div>
  )
}
