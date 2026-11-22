import { AppError } from '../../shared/errors/AppError';
import { toDate, toDay } from '../../shared/utils/dates';
import type { CreateTripDto, UpdateTripDto } from './trips.schema';
import type {
  ITripsRepository,
  TripRecord,
  TripRole,
  TripShape,
  TripWriteData,
} from './trips.types';

const ROLE_ORDER: Record<TripRole, number> = { OWNER: 0, EDITOR: 1, VIEWER: 2 };


function toShape(record: TripRecord, userId: number): TripShape {
  const members = [...record.members]
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role])
    .map((m) => ({ userId: m.userId, name: m.user.name, email: m.user.email, role: m.role }));
  const mine = members.find((m) => m.userId === userId);
  if (!mine) throw new AppError('Trip not found', 404);
  return {
    id: record.id,
    title: record.title,
    destination: record.destination,
    startDate: toDay(record.startDate),
    endDate: record.endDate ? toDay(record.endDate) : null,
    coverColor: record.coverColor,
    coverImageUrl: record.coverImageUrl,
    currency: record.currency,
    myRole: mine.role,
    members,
  };
}

export class TripsService {
  constructor(private readonly repo: ITripsRepository) {}

  async list(userId: number): Promise<TripShape[]> {
    const records = await this.repo.listForUser(userId);
    return records
      .filter((r) => r.members.some((m) => m.userId === userId))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .map((r) => toShape(r, userId));
  }

  async get(userId: number, tripId: number): Promise<TripShape> {
    const record = await this.requireRole(userId, tripId, ['OWNER', 'EDITOR', 'VIEWER']);
    return toShape(record, userId);
  }

  async create(userId: number, dto: CreateTripDto): Promise<TripShape> {
    const record = await this.repo.createWithOwner(userId, {
      title: dto.title,
      destination: dto.destination,
      startDate: toDate(dto.startDate),
      endDate: dto.endDate ? toDate(dto.endDate) : null,
      coverColor: dto.coverColor ?? 'sky',
    });
    return toShape(record, userId);
  }

  async update(userId: number, tripId: number, dto: UpdateTripDto): Promise<TripShape> {
    const existing = await this.requireRole(userId, tripId, ['OWNER', 'EDITOR']);

    const start = dto.startDate !== undefined ? toDate(dto.startDate) : existing.startDate;
    const end =
      dto.endDate !== undefined ? (dto.endDate === null ? null : toDate(dto.endDate)) : existing.endDate;
    if (end && end.getTime() < start.getTime()) {
      throw new AppError('endDate must be on or after startDate', 400);
    }

    const data: Partial<TripWriteData> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.destination !== undefined) data.destination = dto.destination;
    if (dto.startDate !== undefined) data.startDate = start;
    if (dto.endDate !== undefined) data.endDate = end;
    if (dto.coverColor !== undefined) data.coverColor = dto.coverColor;

    const updated = await this.repo.update(tripId, data);
    return toShape(updated, userId);
  }

  async remove(userId: number, tripId: number): Promise<{ coverImageUrl: string | null }> {
    const record = await this.requireRole(userId, tripId, ['OWNER']);
    await this.repo.delete(tripId);
    return { coverImageUrl: record.coverImageUrl };
  }

  async setCoverImage(
    userId: number,
    tripId: number,
    url: string | null,
  ): Promise<{ trip: TripShape; previousUrl: string | null }> {
    const existing = await this.requireRole(userId, tripId, ['OWNER', 'EDITOR']);
    const updated = await this.repo.update(tripId, { coverImageUrl: url });
    return { trip: toShape(updated, userId), previousUrl: existing.coverImageUrl };
  }

  // Membership gate for everything inside a trip: 404 for non-members, 403 for a low role.
  async requireRole(userId: number, tripId: number, allowed: TripRole[]): Promise<TripRecord> {
    const record = await this.repo.findById(tripId);
    const member = record?.members.find((m) => m.userId === userId);
    if (!record || !member) throw new AppError('Trip not found', 404);
    if (!allowed.includes(member.role)) throw new AppError('Forbidden', 403);
    return record;
  }
}
