import { AppError } from '../errors/AppError';
import {
  CAN_EDIT,
  CAN_VIEW,
  type ITripItemRepository,
  type TripAccess,
  type TripItemMapper,
} from './tripItem.types';

// CRUD for items owned by a trip. Updates replace the whole item.
export class TripItemService<TRecord extends { id: number }, TDto, TData, TShape> {
  constructor(
    private readonly repo: ITripItemRepository<TRecord, TData>,
    private readonly access: TripAccess,
    private readonly mapper: TripItemMapper<TRecord, TDto, TData, TShape>,
  ) {}

  async list(userId: number, tripId: number): Promise<TShape[]> {
    await this.access.requireRole(userId, tripId, CAN_VIEW);
    const records = await this.repo.list(tripId);
    return records.map((r) => this.mapper.toShape(r));
  }

  async create(userId: number, tripId: number, dto: TDto): Promise<TShape> {
    const trip = await this.access.requireRole(userId, tripId, CAN_EDIT);
    const record = await this.repo.create(tripId, this.mapper.toData(dto, trip));
    return this.mapper.toShape(record);
  }

  async update(userId: number, tripId: number, id: number, dto: TDto): Promise<TShape> {
    const trip = await this.access.requireRole(userId, tripId, CAN_EDIT);
    const existing = await this.requireItem(tripId, id);
    const record = await this.repo.update(existing.id, this.mapper.toData(dto, trip));
    return this.mapper.toShape(record);
  }

  async remove(userId: number, tripId: number, id: number): Promise<void> {
    await this.access.requireRole(userId, tripId, CAN_EDIT);
    const existing = await this.requireItem(tripId, id);
    await this.repo.delete(existing.id);
  }

  private async requireItem(tripId: number, id: number): Promise<TRecord> {
    const record = await this.repo.find(tripId, id);
    if (!record) throw new AppError(this.mapper.notFound, 404);
    return record;
  }
}
