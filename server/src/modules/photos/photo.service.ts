import { normalizeQuery, photoQuery } from '../map/map.queries';
import type { PhotoFinder } from './photo.finder';
import type { IPhotoFiles } from './photo.store';
import type { PhotoTarget, PlacePhotos } from './photo.types';

// A place without a photo is tried again after a while: the sources it's looked up in grow.
const RETRY_NOT_FOUND_MS = 7 * 24 * 60 * 60 * 1000;

export class PhotoService implements PlacePhotos {
  constructor(
    private readonly finder: Pick<PhotoFinder, 'enqueue'>,
    private readonly files: IPhotoFiles,
    private readonly now: () => number = Date.now,
  ) {}

  refresh(destination: string, places: PhotoTarget[]): number {
    let pending = 0;
    for (const place of places) {
      if (!this.due(place)) continue;
      const accepted = this.finder.enqueue({
        placeId: place.id,
        name: place.name,
        website: place.website,
        query: photoQuery(place.name, destination),
        areaQuery: normalizeQuery(destination),
      });
      if (accepted) pending++;
    }
    return pending;
  }

  async discard(photoUrl: string | null): Promise<void> {
    // A leftover file is harmless; failing the request over it isn't.
    await this.files.delete(photoUrl).catch(() => undefined);
  }

  private due({ photoUrl, photoCheckedAt }: PhotoTarget): boolean {
    if (!photoCheckedAt) return true;
    return !photoUrl && this.now() - photoCheckedAt.getTime() >= RETRY_NOT_FOUND_MS;
  }
}
