import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/AppError';

export const UPLOADS_ROOT = path.resolve(__dirname, '../../../uploads');
const COVERS_DIR = path.join(UPLOADS_ROOT, 'covers');
fs.mkdirSync(COVERS_DIR, { recursive: true });

const COVER_URL_PREFIX = '/api/uploads/covers/';
const TYPE_MSG = 'Only JPG, PNG or WebP images are allowed';
const SIZE_MSG = 'Image must be 5 MB or smaller';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const coverUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, COVERS_DIR),
    filename: (_req, file, cb) => {
      const tripId = (_req.res?.locals['id'] as number | undefined) ?? 'trip';
      cb(null, `${tripId}-${crypto.randomUUID()}.${EXT_BY_MIME[file.mimetype]}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) cb(null, true);
    else cb(new AppError(TYPE_MSG, 400));
  },
});

export function handleCoverUpload(req: Request, res: Response, next: NextFunction): void {
  coverUpload.single('cover')(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      return next(
        err.code === 'LIMIT_FILE_SIZE' ? new AppError(SIZE_MSG, 400) : new AppError(err.message, 400),
      );
    }
    next(err);
  });
}

export async function deleteCoverFile(url: string | null): Promise<void> {
  if (!url || !url.startsWith(COVER_URL_PREFIX)) return;
  const name = path.basename(url);
  try {
    await fs.promises.unlink(path.join(COVERS_DIR, name));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}
