export interface PhotoJob {
  placeId: number;
  // As they were when the lookup was asked for: a result for an older name or website is dropped.
  name: string;
  website: string | null;
  // The geocoder lookup whose tags lead to a photo; null when the name can't be looked up.
  query: string | null;
  areaQuery: string;
}

export interface IPhotoRepository {
  // Records a finished lookup (null: nothing found). False when the place changed or is gone.
  setPhoto(job: PhotoJob, photoUrl: string | null): Promise<boolean>;
}

// What the places module needs from this one.
export interface PlacePhotos {
  // Starts lookups for the places that need one and returns how many are now under way.
  refresh(destination: string, places: PhotoTarget[]): number;
  discard(photoUrl: string | null): Promise<void>;
}

export interface PhotoTarget {
  id: number;
  name: string;
  website: string | null;
  photoUrl: string | null;
  photoCheckedAt: Date | null;
}
