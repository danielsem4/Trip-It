import type { Bbox, GeoHit, GeoTags, Geocoder, IGeocodeStore } from './map.types';

// Nominatim's usage policy: at most one request a second, an identifying User-Agent, cached results.
const SPACING_MS = 1100;
const COOLDOWN_MS = 60_000;
const TIMEOUT_MS = 10_000;
const MAX_QUEUE = 500;
export const USER_AGENT = 'trip-it/1.0 (trip planner)';

interface NominatimResult {
  lat: string;
  lon: string;
  boundingbox?: string[];
  extratags?: Record<string, unknown> | null;
}

export type FetchLike = (url: string, init: { headers: Record<string, string>; signal: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

interface Options {
  baseUrl?: string;
  fetch?: FetchLike;
  wait?: (ms: number) => Promise<void>;
  now?: () => number;
}

function toHit(result: NominatimResult | undefined): GeoHit | null {
  if (!result) return null;
  const lat = Number(result.lat);
  const lng = Number(result.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const box = (result.boundingbox ?? []).map(Number);
  const bbox = box.length === 4 && box.every(Number.isFinite) ? (box as Bbox) : null;
  return { lat, lng, bbox };
}

function toTags(result: NominatimResult | undefined): GeoTags {
  const entries = Object.entries(result?.extratags ?? {}).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
  return Object.fromEntries(entries);
}

// One queue for the whole process, so the rate limit holds no matter how many trips are open.
export class NominatimGeocoder implements Geocoder {
  private readonly queue = new Map<string, Bbox | null>();
  private readonly baseUrl: string;
  private readonly fetch: FetchLike;
  private readonly wait: (ms: number) => Promise<void>;
  private readonly now: () => number;
  private running = false;
  private pausedUntil = 0;

  constructor(
    private readonly store: IGeocodeStore,
    options: Options = {},
  ) {
    this.baseUrl = options.baseUrl ?? 'https://nominatim.openstreetmap.org';
    this.fetch = options.fetch ?? (globalThis.fetch as unknown as FetchLike);
    this.wait = options.wait ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.now = options.now ?? Date.now;
  }

  enqueue(query: string, near: Bbox | null = null): boolean {
    if (this.now() < this.pausedUntil) return false;
    if (this.queue.has(query)) return true;
    if (this.queue.size >= MAX_QUEUE) return false;
    this.queue.set(query, near);
    if (!this.running) void this.run();
    return true;
  }

  private async run(): Promise<void> {
    this.running = true;
    try {
      while (this.queue.size > 0) {
        const [query, near] = this.queue.entries().next().value!;
        try {
          const { hit, tags } = await this.lookup(query, near);
          await this.store.save(query, hit, tags);
        } catch (err) {
          // The service is down or pushing back: stop asking for a while, and cache nothing.
          console.error('[geocoder] lookup failed, pausing:', err instanceof Error ? err.message : err);
          this.pausedUntil = this.now() + COOLDOWN_MS;
          this.queue.clear();
          return;
        } finally {
          // Only now, so the same text asked again meanwhile doesn't queue twice.
          this.queue.delete(query);
        }
        await this.wait(SPACING_MS);
      }
    } finally {
      this.running = false;
    }
  }

  private async lookup(query: string, near: Bbox | null): Promise<{ hit: GeoHit | null; tags: GeoTags }> {
    // The tags are what place photos are found from.
    const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', extratags: '1' });
    if (near) {
      const [south, north, west, east] = near;
      // A preference, not a filter: results outside the box are still returned.
      params.set('viewbox', `${west},${north},${east},${south}`);
    }
    const res = await this.fetch(`${this.baseUrl}/search?${params}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`geocoder responded ${res.status}`);
    const results = (await res.json()) as NominatimResult[];
    const hit = toHit(Array.isArray(results) ? results[0] : undefined);
    return { hit, tags: hit ? toTags(results[0]) : {} };
  }
}
