import fs from 'fs';
import path from 'path';
import { del, put } from '@vercel/blob';

export interface FileStore {
  // Stores the file and returns the URL it is served from.
  save(folder: string, name: string, data: Buffer, contentType: string): Promise<string>;
  // Ignores URLs this store didn't hand out.
  delete(url: string | null): Promise<void>;
}

export const UPLOADS_ROOT = path.resolve(__dirname, '../../../uploads');
export const UPLOADS_URL_PREFIX = '/api/uploads/';

// Local development: files under server/uploads, served by express.static.
class DiskStore implements FileStore {
  async save(folder: string, name: string, data: Buffer): Promise<string> {
    const dir = path.join(UPLOADS_ROOT, folder);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, name), data);
    return `${UPLOADS_URL_PREFIX}${folder}/${name}`;
  }

  async delete(url: string | null): Promise<void> {
    if (!url || !url.startsWith(UPLOADS_URL_PREFIX)) return;
    const file = path.resolve(UPLOADS_ROOT, url.slice(UPLOADS_URL_PREFIX.length));
    if (!file.startsWith(UPLOADS_ROOT + path.sep)) return;
    try {
      await fs.promises.unlink(file);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }
}

// Production: Vercel Blob, since a function's disk doesn't outlive the request.
class BlobStore implements FileStore {
  async save(folder: string, name: string, data: Buffer, contentType: string): Promise<string> {
    const blob = await put(`${folder}/${name}`, data, { access: 'public', contentType, addRandomSuffix: false });
    return blob.url;
  }

  async delete(url: string | null): Promise<void> {
    if (!url || !/^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(url)) return;
    await del(url);
  }
}

export const usesDiskStore = !process.env['BLOB_READ_WRITE_TOKEN'];
export const fileStore: FileStore = usesDiskStore ? new DiskStore() : new BlobStore();
