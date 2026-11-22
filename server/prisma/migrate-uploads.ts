// One-off: moves the images in server/uploads to Vercel Blob and points the rows at them.
// Run with DATABASE_URL and BLOB_READ_WRITE_TOKEN set; safe to run again.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';
import prisma from '../src/lib/prisma';

const UPLOADS_ROOT = path.resolve(__dirname, '../uploads');
const PREFIX = '/api/uploads/';
const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

async function upload(url: string): Promise<string | null> {
  const relative = url.slice(PREFIX.length);
  const file = path.join(UPLOADS_ROOT, relative);
  if (!fs.existsSync(file)) return null;
  const contentType = TYPES[path.extname(file).slice(1)] ?? 'application/octet-stream';
  const blob = await put(relative, await fs.promises.readFile(file), {
    access: 'public',
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.url;
}

async function main(): Promise<void> {
  let moved = 0;
  const missing: string[] = [];

  const trips = await prisma.trip.findMany({
    where: { coverImageUrl: { startsWith: PREFIX } },
    select: { id: true, coverImageUrl: true },
  });
  for (const trip of trips) {
    const url = await upload(trip.coverImageUrl!);
    if (!url) missing.push(trip.coverImageUrl!);
    await prisma.trip.update({ where: { id: trip.id }, data: { coverImageUrl: url } });
    if (url) moved++;
  }

  const places = await prisma.place.findMany({
    where: { photoUrl: { startsWith: PREFIX } },
    select: { id: true, photoUrl: true },
  });
  for (const place of places) {
    const url = await upload(place.photoUrl!);
    if (!url) missing.push(place.photoUrl!);
    // A lost place photo is looked up again by itself once photoCheckedAt is cleared.
    await prisma.place.update({
      where: { id: place.id },
      data: url ? { photoUrl: url } : { photoUrl: null, photoCheckedAt: null },
    });
    if (url) moved++;
  }

  console.log(`Moved ${moved} of ${trips.length + places.length} images to Blob.`);
  if (missing.length) console.log(`No local file for:\n  ${missing.join('\n  ')}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
