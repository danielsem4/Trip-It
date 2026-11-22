export type Bbox = [south: number, north: number, west: number, east: number];

export interface Coords {
  lat: number;
  lng: number;
}

export interface GeoHit extends Coords {
  bbox: Bbox | null;
}

// One geocoded lookup. A null hit means the text was looked up and nothing was found.
export interface GeocodeRow {
  query: string;
  hit: GeoHit | null;
  checkedAt: Date;
}

export interface MapPoint extends Coords {
  kind: 'stay' | 'place' | 'transport';
  itemId: number;
  // Transport has a dot at each end.
  end?: 'from' | 'to';
}

export interface MapShape {
  // Where the trip's destination is; null until it has been located.
  area: GeoHit | null;
  points: MapPoint[];
  // Lookups still running: the client asks again while this is above zero.
  pending: number;
}

export interface Locatable {
  id: number;
  name: string;
  address: string | null;
  mapUrl: string | null;
}

export interface MapItems {
  stays: Locatable[];
  places: Locatable[];
  transport: { id: number; fromPlace: string | null; toPlace: string | null }[];
}

export interface IMapRepository {
  listItems(tripId: number): Promise<MapItems>;
}

export interface IGeocodeStore {
  find(queries: string[]): Promise<GeocodeRow[]>;
  save(query: string, hit: GeoHit | null): Promise<void>;
}

export interface Geocoder {
  // Queues a lookup whose result lands in the store. False when it won't be tried for now.
  enqueue(query: string, near?: Bbox | null): boolean;
}
