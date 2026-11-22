import prisma from '../../lib/prisma';
import type { IPhotoRepository, PhotoJob } from './photo.types';

export class PhotoRepository implements IPhotoRepository {
  async setPhoto({ placeId, name, website }: PhotoJob, photoUrl: string | null): Promise<boolean> {
    const { count } = await prisma.place.updateMany({
      where: { id: placeId, name, website },
      data: { photoUrl, photoCheckedAt: new Date() },
    });
    return count > 0;
  }
}
