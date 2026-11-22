import { describe, expect, it } from 'vitest';
import { NominatimGeocoder, type FetchLike } from './geocoder';
import type { GeoHit, GeoTags, IGeocodeStore } from './map.types';

function setup(respond: (url: URL) => { ok?: boolean; status?: number; body?: unknown }) {
  const saved = new Map<string, GeoHit | null>();
  const tags = new Map<string, GeoTags>();
  const store: IGeocodeStore = {
    async find() {
      return [];
    },
    async save(query, hit, found) {
      saved.set(query, hit);
      tags.set(query, found);
    },
  };
  const calls: URL[] = [];
  const waits: number[] = [];
  let clock = 0;
  const fetch: FetchLike = async (url) => {
    calls.push(new URL(url));
    const { ok = true, status = 200, body = [] } = respond(new URL(url));
    return { ok, status, json: async () => body };
  };
  const geocoder = new NominatimGeocoder(store, {
    baseUrl: 'https://geo.test',
    fetch,
    wait: async (ms) => {
      waits.push(ms);
    },
    now: () => clock,
  });
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
  return { geocoder, saved, tags, calls, waits, settle, advance: (ms: number) => (clock += ms) };
}

const amsterdam = { lat: '52.37', lon: '4.89', boundingbox: ['52.3', '52.4', '4.7', '5.0'] };

describe('NominatimGeocoder', () => {
  it('saves a hit with its bounding box', async () => {
    const { geocoder, saved, calls, settle } = setup(() => ({ body: [amsterdam] }));
    expect(geocoder.enqueue('amsterdam')).toBe(true);
    await settle();
    expect(saved.get('amsterdam')).toEqual({ lat: 52.37, lng: 4.89, bbox: [52.3, 52.4, 4.7, 5.0] });
    expect(calls[0]!.pathname).toBe('/search');
    expect(calls[0]!.searchParams.get('q')).toBe('amsterdam');
  });

  it('asks for the place\'s tags and saves the text ones', async () => {
    const casino = { ...amsterdam, extratags: { wikidata: 'Q2982262', building: 'yes', levels: 3 } };
    const { geocoder, tags, calls, settle } = setup(() => ({ body: [casino] }));
    geocoder.enqueue('holland casino, amsterdam');
    await settle();
    expect(calls[0]!.searchParams.get('extratags')).toBe('1');
    expect(tags.get('holland casino, amsterdam')).toEqual({ wikidata: 'Q2982262', building: 'yes' });
  });

  it('saves a miss as null', async () => {
    const { geocoder, saved, settle } = setup(() => ({ body: [] }));
    geocoder.enqueue('nowhere at all');
    await settle();
    expect(saved.has('nowhere at all')).toBe(true);
    expect(saved.get('nowhere at all')).toBeNull();
  });

  it('asks once for a text queued twice, one request at a time with a pause between', async () => {
    const { geocoder, calls, waits, settle } = setup(() => ({ body: [amsterdam] }));
    geocoder.enqueue('a');
    geocoder.enqueue('a');
    geocoder.enqueue('b');
    await settle();
    expect(calls.map((u) => u.searchParams.get('q'))).toEqual(['a', 'b']);
    expect(waits).toEqual([1100, 1100]);
  });

  it('passes the trip area as a west,north,east,south preference', async () => {
    const { geocoder, calls, settle } = setup(() => ({ body: [] }));
    geocoder.enqueue('centraal', [52.3, 52.4, 4.7, 5.0]);
    await settle();
    expect(calls[0]!.searchParams.get('viewbox')).toBe('4.7,52.4,5,52.3');
    expect(calls[0]!.searchParams.has('bounded')).toBe(false);
  });

  it('caches nothing on an error and refuses work until the cooldown ends', async () => {
    const { geocoder, saved, calls, settle, advance } = setup(() => ({ ok: false, status: 429 }));
    geocoder.enqueue('a');
    geocoder.enqueue('b');
    await settle();
    expect(saved.size).toBe(0);
    expect(calls).toHaveLength(1);
    expect(geocoder.enqueue('a')).toBe(false);
    advance(60_001);
    expect(geocoder.enqueue('a')).toBe(true);
  });
});
