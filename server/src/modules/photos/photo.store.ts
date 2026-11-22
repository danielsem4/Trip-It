import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { UPLOADS_ROOT } from '../trips/trips.upload';

const PLACES_DIR = path.join(UPLOADS_ROOT, 'places');
fs.mkdirSync(PLACES_DIR, { recursive: true });

const PHOTO_URL_PREFIX = '/api/uploads/places/';
const WIDTH = 480;
// Smaller than this is a logo, an icon or a tracking pixel, not a photo.
const MIN_SIDE = 100;
const FORMATS = new Set(['jpeg', 'png', 'webp']);

export interface IPhotoFiles {
  // Stores the image as a small thumbnail and returns its URL; null when it isn't a usable photo.
  save(placeId: number, image: Buffer): Promise<string | null>;
  delete(url: string | null): Promise<void>;
}

export class PhotoFiles implements IPhotoFiles {
  async save(placeId: number, image: Buffer): Promise<string | null> {
    let thumbnail: Buffer;
    try {
      const { format, width = 0, height = 0 } = await sharp(image).metadata();
      if (!format || !FORMATS.has(format) || width < MIN_SIDE || height < MIN_SIDE) return null;
      thumbnail = await sharp(image)
        .rotate()
        .resize({ width: WIDTH, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer();
    } catch {
      return null;
    }
    const name = `${placeId}-${crypto.randomUUID()}.webp`;
    await fs.promises.writeFile(path.join(PLACES_DIR, name), thumbnail);
    return PHOTO_URL_PREFIX + name;
  }

  async delete(url: string | null): Promise<void> {
    if (!url || !url.startsWith(PHOTO_URL_PREFIX)) return;
    try {
      await fs.promises.unlink(path.join(PLACES_DIR, path.basename(url)));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }
}
