import { AppError } from '../../shared/errors/AppError';
import { CAN_EDIT, CAN_VIEW, type TripAccess } from '../../shared/tripItems/tripItem.types';
import { summarizeBudget } from './budget.math';
import type { BudgetSettingsDto } from './budget.schema';
import type { BudgetShape, IBudgetRepository } from './budget.types';

export class BudgetService {
  constructor(
    private readonly repo: IBudgetRepository,
    private readonly access: TripAccess,
  ) {}

  async get(userId: number, tripId: number): Promise<BudgetShape> {
    const trip = await this.access.requireRole(userId, tripId, CAN_VIEW);
    return this.build(tripId, trip.currency, trip.budgetAmount);
  }

  async updateSettings(userId: number, tripId: number, dto: BudgetSettingsDto): Promise<BudgetShape> {
    const trip = await this.access.requireRole(userId, tripId, CAN_EDIT);
    await this.repo.updateSettings(tripId, dto, dto.currency !== trip.currency);
    return this.build(tripId, dto.currency, dto.budgetAmount);
  }

  async setRate(userId: number, tripId: number, currency: string, rate: number): Promise<BudgetShape> {
    const trip = await this.access.requireRole(userId, tripId, CAN_EDIT);
    if (currency === trip.currency) {
      throw new AppError("The trip's main currency doesn't need a rate", 400);
    }
    await this.repo.setRate(tripId, currency, rate);
    return this.build(tripId, trip.currency, trip.budgetAmount);
  }

  async removeRate(userId: number, tripId: number, currency: string): Promise<BudgetShape> {
    const trip = await this.access.requireRole(userId, tripId, CAN_EDIT);
    await this.repo.deleteRate(tripId, currency);
    return this.build(tripId, trip.currency, trip.budgetAmount);
  }

  private async build(tripId: number, currency: string, budgetAmount: number | null): Promise<BudgetShape> {
    const [lines, rates] = await Promise.all([this.repo.listLines(tripId), this.repo.listRates(tripId)]);
    const summary = summarizeBudget({
      mainCurrency: currency,
      budgetAmount,
      rates: Object.fromEntries(rates.map((r) => [r.currency, r.rate])),
      lines,
    });
    return { currency, budgetAmount, rates, ...summary };
  }
}
