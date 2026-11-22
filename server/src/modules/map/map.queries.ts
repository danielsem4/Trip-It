import type { Locatable } from './map.types';

const MAX_QUERY_LENGTH = 250;

// The cache key, and what is sent to the geocoder.
export function normalizeQuery(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

function candidates(...texts: string[]): string[] {
  const queries = texts.map(normalizeQuery).filter((q) => q.length > 0 && q.length <= MAX_QUERY_LENGTH);
  return [...new Set(queries)];
}

// Lookups to try, in order, for a stay or a place: its address, or its name within the destination.
export function placeQueries(item: Pick<Locatable, 'name' | 'address'>, destination: string): string[] {
  const address = item.address?.trim();
  return address
    ? candidates(address, `${address}, ${destination}`)
    : candidates(`${item.name}, ${destination}`);
}

// One end of a transport ride: often another city, so the text is tried on its own first.
export function transportQueries(place: string | null, destination: string): string[] {
  const text = place?.trim();
  return text ? candidates(text, `${text}, ${destination}`) : [];
}

// Finds the venue itself rather than its street address: that's the entry that carries photo tags.
export function photoQuery(name: string, destination: string): string | null {
  return candidates(`${name}, ${destination}`)[0] ?? null;
}
