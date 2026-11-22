import { waitUntil } from '@vercel/functions';
import type { Geocoder, IGeocodeStore } from '../map/map.types';
import type { SafeFetch } from './safeFetch';
import type { IPhotoFiles } from './photo.store';
import type { IPhotoRepository, PhotoJob } from './photo.types';
import {
  imageFromClaims,
  imageFromPageImages,
  photoSources,
  previewImage,
  wikidataClaimsUrl,
  wikipediaImageUrl,
  type PhotoSource,
} from './photo.sources';

const COOLDOWN_MS = 60_000;
const MAX_QUEUE = 500;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_PAGE_BYTES = 3 * 1024 * 1024;

// Finds a photo for one place at a time, in the background.
export class PhotoFinder {
  private readonly queue = new Map<number, PhotoJob>();
  private running = false;
  private pausedUntil = 0;

  constructor(
    private readonly store: IGeocodeStore,
    private readonly geocoder: Geocoder,
    private readonly repo: IPhotoRepository,
    private readonly files: IPhotoFiles,
    private readonly fetch: SafeFetch,
    private readonly now: () => number = Date.now,
  ) {}

  // False when the lookup won't be tried for now.
  enqueue(job: PhotoJob): boolean {
    if (this.now() < this.pausedUntil) return false;
    if (this.queue.has(job.placeId)) return true;
    if (this.queue.size >= MAX_QUEUE) return false;
    this.queue.set(job.placeId, job);
    // On Vercel this keeps the function alive until the queue has drained.
    if (!this.running) waitUntil(this.run());
    return true;
  }

  private async run(): Promise<void> {
    this.running = true;
    try {
      while (this.queue.size > 0) {
        const job: PhotoJob = this.queue.values().next().value!;
        try {
          await this.find(job);
        } catch (err) {
          console.error('[photos] lookup failed, pausing:', err instanceof Error ? err.message : err);
          this.pause();
          return;
        } finally {
          this.queue.delete(job.placeId);
        }
      }
    } finally {
      this.running = false;
    }
  }

  private pause(): void {
    this.pausedUntil = this.now() + COOLDOWN_MS;
    this.queue.clear();
  }

  private async find(job: PhotoJob): Promise<void> {
    const rows = job.query ? await this.store.find([job.query, job.areaQuery]) : [];
    const tags = job.query ? rows.find((row) => row.query === job.query)?.tags : {};
    if (!tags) {
      // Not looked up yet: the place is asked about again once the geocoder has been through it.
      const near = rows.find((row) => row.query === job.areaQuery)?.hit?.bbox ?? null;
      if (!this.geocoder.enqueue(job.query!, near)) this.pause();
      return;
    }

    let photoUrl: string | null = null;
    for (const source of photoSources(tags, job.website)) {
      try {
        const imageUrl = await this.locate(source);
        if (!imageUrl) continue;
        const image = await this.fetch(imageUrl, MAX_IMAGE_BYTES);
        photoUrl = await this.files.save(job.placeId, image.body);
        if (photoUrl) break;
      } catch {
        // A dead link or a site that's down: the next source may still work.
      }
    }

    const stored = await this.repo.setPhoto(job, photoUrl);
    if (!stored) await this.files.delete(photoUrl);
  }

  private async locate(source: PhotoSource): Promise<string | null> {
    switch (source.kind) {
      case 'image':
        return source.url;
      case 'wikidata':
        return imageFromClaims(await this.json(wikidataClaimsUrl(source.id)));
      case 'wikipedia':
        return imageFromPageImages(await this.json(wikipediaImageUrl(source.lang, source.title)));
      case 'website': {
        const page = await this.fetch(source.url, MAX_PAGE_BYTES);
        return previewImage(page.body.toString('utf8'), page.url);
      }
    }
  }

  private async json(url: string): Promise<unknown> {
    return JSON.parse((await this.fetch(url, MAX_PAGE_BYTES)).body.toString('utf8'));
  }
}
