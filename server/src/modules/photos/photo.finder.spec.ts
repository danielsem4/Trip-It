import { beforeEach, describe, expect, it } from 'vitest';
import type { Bbox, GeocodeRow, Geocoder, GeoTags, IGeocodeStore } from '../map/map.types';
import { PhotoFinder } from './photo.finder';
import { commonsFileUrl } from './photo.sources';
import type { IPhotoFiles } from './photo.store';
import type { IPhotoRepository, PhotoJob } from './photo.types';
import type { SafeFetch } from './safeFetch';

const BBOX: Bbox = [52.3, 52.4, 4.7, 5.0];
const QUERY = 'holland casino, amsterdam';
const job: PhotoJob = { placeId: 7, name: 'Holland Casino', website: null, query: QUERY, areaQuery: 'amsterdam' };

let rows: GeocodeRow[];
let asked: { query: string; near: Bbox | null }[];
let geocoding: boolean;
let web: Record<string, string>;
let fetched: string[];
let stored: { placeId: number; photoUrl: string | null }[];
let deleted: (string | null)[];
let placeChanged: boolean;
let clock: number;

const store: IGeocodeStore = {
  find: async (queries) => rows.filter((r) => queries.includes(r.query)),
  save: async () => {},
};
const geocoder: Geocoder = {
  enqueue(query, near = null) {
    if (geocoding) asked.push({ query, near });
    return geocoding;
  },
};
const repo: IPhotoRepository = {
  async setPhoto({ placeId }, photoUrl) {
    if (placeChanged) return false;
    stored.push({ placeId, photoUrl });
    return true;
  },
};
// Anything whose content starts with "photo" passes for a picture.
const files: IPhotoFiles = {
  save: async (placeId, image) => (image.toString().startsWith('photo') ? `/api/uploads/places/${placeId}.webp` : null),
  async delete(url) {
    deleted.push(url);
  },
};
const fetch: SafeFetch = async (url) => {
  fetched.push(url);
  const body = web[url];
  if (body === undefined) throw new Error('responded 404');
  return { url, contentType: '', body: Buffer.from(body) };
};

const tagged = (tags: GeoTags | null, query = QUERY): GeocodeRow => ({
  query,
  hit: { lat: 52.36, lng: 4.88, bbox: query === 'amsterdam' ? BBOX : null },
  tags,
  checkedAt: new Date(0),
});
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

let finder: PhotoFinder;

beforeEach(() => {
  rows = [];
  asked = [];
  geocoding = true;
  web = {};
  fetched = [];
  stored = [];
  deleted = [];
  placeChanged = false;
  clock = 0;
  finder = new PhotoFinder(store, geocoder, repo, files, fetch, () => clock);
});

describe('PhotoFinder', () => {
  it('asks the geocoder about a place it has no tags for, near the destination, and records nothing yet', async () => {
    rows = [tagged({}, 'amsterdam'), tagged(null)];
    expect(finder.enqueue(job)).toBe(true);
    await settle();
    expect(asked).toEqual([{ query: QUERY, near: BBOX }]);
    expect(stored).toEqual([]);
  });

  it('saves the first source that turns out to be a photo', async () => {
    const commons = commonsFileUrl('Holland Casino.jpg');
    rows = [tagged({ image: 'https://example.org/logo.svg', wikidata: 'Q1', website: 'https://casino.example/' })];
    web = {
      'https://example.org/logo.svg': '<svg/>',
      'https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=Q1&property=P18&format=json': JSON.stringify({
        claims: { P18: [{ mainsnak: { datavalue: { value: 'Holland Casino.jpg' } } }] },
      }),
      [commons]: 'photo of the casino',
    };
    finder.enqueue(job);
    await settle();
    expect(stored).toEqual([{ placeId: 7, photoUrl: '/api/uploads/places/7.webp' }]);
    expect(fetched).not.toContain('https://casino.example/');
  });

  it('falls back to the preview image of the place\'s own website', async () => {
    rows = [tagged({ wikidata: 'Q1' })];
    web = {
      'https://cafe.example/': '<meta property="og:image" content="/front.jpg">',
      'https://cafe.example/front.jpg': 'photo of the cafe',
    };
    finder.enqueue({ ...job, website: 'https://cafe.example/' });
    await settle();
    expect(stored).toEqual([{ placeId: 7, photoUrl: '/api/uploads/places/7.webp' }]);
  });

  it('records a place nothing was found for, with or without a lookup text', async () => {
    rows = [tagged({ website: 'https://gone.example/' })];
    finder.enqueue(job);
    finder.enqueue({ ...job, placeId: 8, query: null });
    await settle();
    expect(stored).toEqual([
      { placeId: 7, photoUrl: null },
      { placeId: 8, photoUrl: null },
    ]);
    expect(asked).toEqual([]);
  });

  it('throws the file away when the place changed meanwhile', async () => {
    rows = [tagged({ image: 'https://example.org/casino.jpg' })];
    web = { 'https://example.org/casino.jpg': 'photo' };
    placeChanged = true;
    finder.enqueue(job);
    await settle();
    expect(deleted).toEqual(['/api/uploads/places/7.webp']);
  });

  it('stops taking work for a while when the geocoder is not accepting any', async () => {
    geocoding = false;
    expect(finder.enqueue(job)).toBe(true);
    await settle();
    expect(finder.enqueue(job)).toBe(false);
    clock += 60_001;
    expect(finder.enqueue(job)).toBe(true);
  });
});
