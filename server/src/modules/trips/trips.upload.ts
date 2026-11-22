import crypto from 'crypto';
import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/AppError';
import { fileStore } from '../../shared/storage/fileStore';

const TYPE_MSG = 'Only JPG, PNG or WebP images are allowed';
const SIZE_MSG = 'Image must be 4 MB or smaller';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const coverUpload = multer({
  storage: multer.memoryStorage(),
  // Vercel rejects request bodies over 4.5 MB.
  limits: { fileSize: 4 * 1024 * 1024 },
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

export function saveCoverFile(tripId: number, file: Express.Multer.File): Promise<string> {
  const name = `${tripId}-${crypto.randomUUID()}.${EXT_BY_MIME[file.mimetype]}`;
  return fileStore.save('covers', name, file.buffer, file.mimetype);
}

export function deleteCoverFile(url: string | null): Promise<void> {
  return fileStore.delete(url);
}
