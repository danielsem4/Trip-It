import { describe, expect, it } from 'vitest';
import { PhotoService } from './photo.service';
import type { PhotoJob, PhotoTarget } from './photo.types';

const NOW = Date.UTC(2026, 10, 22);
const DAY = 24 * 60 * 60 * 1000;

function setup(accepting = true) {
  const jobs: PhotoJob[] = [];
  const finder = {
    enqueue(job: PhotoJob) {
      if (accepting) jobs.push(job);
      return accepting;
    },
  };
  const files = { save: async () => null, delete: async () => {} };
  return { service: new PhotoService(finder, files, () => NOW), jobs };
}

const place = (input: Partial<PhotoTarget>): PhotoTarget => ({
  id: 1,
  name: 'Holland Casino',
  website: null,
  photoUrl: null,
  photoCheckedAt: null,
  ...input,
});
const daysAgo = (days: number) => new Date(NOW - days * DAY);

describe('PhotoService.refresh', () => {
  it('looks up a new place by its name within the destination', () => {
    const { service, jobs } = setup();
    expect(service.refresh(' Amsterdam ', [place({ website: 'https://hollandcasino.nl' })])).toBe(1);
    expect(jobs).toEqual([
      {
        placeId: 1,
        name: 'Holland Casino',
        website: 'https://hollandcasino.nl',
        query: 'holland casino, amsterdam',
        areaQuery: 'amsterdam',
      },
    ]);
  });

  it('leaves alone places that have a photo or were checked lately, and retries old misses', () => {
    const { service, jobs } = setup();
    const pending = service.refresh('Amsterdam', [
      place({ id: 1, photoUrl: '/api/uploads/places/1.webp', photoCheckedAt: daysAgo(30) }),
      place({ id: 2, photoCheckedAt: daysAgo(6) }),
      place({ id: 3, photoCheckedAt: daysAgo(8) }),
    ]);
    expect(pending).toBe(1);
    expect(jobs.map((job) => job.placeId)).toEqual([3]);
  });

  it('counts nothing as under way while lookups are refused', () => {
    expect(setup(false).service.refresh('Amsterdam', [place({})])).toBe(0);
  });
});
