import { AppError } from '../../shared/errors/AppError';
import { toDateOrNull, toDayOrNull } from '../../shared/utils/dates';
import { normalizePrice } from '../../shared/utils/price';
import { CAN_EDIT, CAN_VIEW, type TripAccess } from '../../shared/tripItems/tripItem.types';
import type { PlacePhotos } from '../photos/photo.types';
import type { PlaceDto, SectionDto } from './sections.schema';
import type {
  ISectionsRepository,
  PlaceRecord,
  PlaceShape,
  SectionRecord,
  SectionShape,
  SectionsList,
} from './sections.types';

const toPlaceShape = ({ sectionId: _sectionId, photoCheckedAt: _checked, ...place }: PlaceRecord): PlaceShape => ({
  ...place,
  date: toDayOrNull(place.date),
});

const toShape = (section: SectionRecord): SectionShape => ({
  id: section.id,
  kind: section.kind,
  name: section.name,
  icon: section.icon,
  places: section.places.map(toPlaceShape),
});

export class SectionsService {
  constructor(
    private readonly repo: ISectionsRepository,
    private readonly access: TripAccess,
    private readonly photos: PlacePhotos,
  ) {}

  async list(userId: number, tripId: number): Promise<SectionsList> {
    const trip = await this.access.requireRole(userId, tripId, CAN_VIEW);
    const sections = await this.repo.list(tripId);
    // Places without a photo get one looked up in the background.
    const pendingPhotos = this.photos.refresh(
      trip.destination,
      sections.flatMap((section) => section.places),
    );
    return { sections: sections.map(toShape), pendingPhotos };
  }

  async create(userId: number, tripId: number, dto: SectionDto): Promise<SectionShape> {
    await this.access.requireRole(userId, tripId, CAN_EDIT);
    return toShape(await this.repo.createCustom(tripId, dto));
  }

  async update(userId: number, tripId: number, sectionId: number, dto: SectionDto): Promise<SectionShape> {
    await this.access.requireRole(userId, tripId, CAN_EDIT);
    const section = await this.requireCustom(tripId, sectionId);
    return toShape(await this.repo.update(section.id, dto));
  }

  async remove(userId: number, tripId: number, sectionId: number): Promise<void> {
    await this.access.requireRole(userId, tripId, CAN_EDIT);
    const section = await this.requireCustom(tripId, sectionId);
    await this.repo.delete(section.id);
    await Promise.all(section.places.map((place) => this.photos.discard(place.photoUrl)));
  }

  async createPlace(userId: number, tripId: number, sectionId: number, dto: PlaceDto): Promise<PlaceShape> {
    const trip = await this.access.requireRole(userId, tripId, CAN_EDIT);
    const section = await this.requireSection(tripId, sectionId);
    const place = await this.repo.createPlace(section.id, {
      ...dto,
      date: toDateOrNull(dto.date),
      ...normalizePrice(dto, trip.currency),
    });
    return toPlaceShape(place);
  }

  async updatePlace(
    userId: number,
    tripId: number,
    sectionId: number,
    placeId: number,
    dto: PlaceDto,
  ): Promise<PlaceShape> {
    const trip = await this.access.requireRole(userId, tripId, CAN_EDIT);
    const place = await this.requirePlace(tripId, sectionId, placeId);
    // The photo was found from the name and the website: once those change it is looked up again.
    const stale = dto.name !== place.name || dto.website !== place.website;
    const previousPhoto = place.photoUrl;
    const updated = await this.repo.updatePlace(place.id, {
      ...dto,
      date: toDateOrNull(dto.date),
      ...normalizePrice(dto, trip.currency),
      ...(stale && { photoUrl: null, photoCheckedAt: null }),
    });
    if (stale) await this.photos.discard(previousPhoto);
    return toPlaceShape(updated);
  }

  async setPlaceDone(
    userId: number,
    tripId: number,
    sectionId: number,
    placeId: number,
    done: boolean,
  ): Promise<PlaceShape> {
    await this.access.requireRole(userId, tripId, CAN_EDIT);
    const place = await this.requirePlace(tripId, sectionId, placeId);
    return toPlaceShape(await this.repo.updatePlace(place.id, { done }));
  }

  async removePlace(userId: number, tripId: number, sectionId: number, placeId: number): Promise<void> {
    await this.access.requireRole(userId, tripId, CAN_EDIT);
    const place = await this.requirePlace(tripId, sectionId, placeId);
    await this.repo.deletePlace(place.id);
    await this.photos.discard(place.photoUrl);
  }

  private async requireSection(tripId: number, sectionId: number): Promise<SectionRecord> {
    const section = await this.repo.find(tripId, sectionId);
    if (!section) throw new AppError('Section not found', 404);
    return section;
  }

  // The built-in sections can't be renamed or deleted.
  private async requireCustom(tripId: number, sectionId: number): Promise<SectionRecord> {
    const section = await this.requireSection(tripId, sectionId);
    if (section.kind !== 'CUSTOM') throw new AppError('Built-in sections cannot be changed', 400);
    return section;
  }

  private async requirePlace(tripId: number, sectionId: number, placeId: number): Promise<PlaceRecord> {
    const section = await this.requireSection(tripId, sectionId);
    const place = section.places.find((p) => p.id === placeId);
    if (!place) throw new AppError('Place not found', 404);
    return place;
  }
}
