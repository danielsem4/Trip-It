import crypto from 'crypto';
import sharp from 'sharp';
import { fileStore } from '../../shared/storage/fileStore';

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
    return fileStore.save('places', `${placeId}-${crypto.randomUUID()}.webp`, thumbnail, 'image/webp');
  }

  delete(url: string | null): Promise<void> {
    return fileStore.delete(url);
  }
}
