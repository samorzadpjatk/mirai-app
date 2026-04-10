import type {
  RewardRepository,
  RewardPurchaseRepository,
  PaginationOptions,
  PaginatedResult,
} from "@mirai-app/use-cases";
import type { Reward, RewardPurchase, RewardId } from "@mirai-app/domain";

/**
 * In-Memory Reward Repository for Testing
 *
 * Implements RewardRepository port with in-memory storage.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryRewardRepository();
 * repo.seed([mockReward]);
 *
 * const byTrip = await repo.findByTripId("trip-123");
 * expect(byTrip.items).toHaveLength(1);
 *
 * repo.reset();
 * ```
 */
export class InMemoryRewardRepository implements RewardRepository {
  private rewards = new Map<string, Reward>();
  private purchases = new Map<string, RewardPurchase>();

  reset(): void {
    this.rewards.clear();
    this.purchases.clear();
  }

  seed(items: Reward[]): void {
    items.forEach((item) => this.rewards.set(item.id, item));
  }

  seedPurchases(purchases: RewardPurchase[]): void {
    purchases.forEach((p) => this.purchases.set(p.id, p));
  }

  async create(reward: Reward): Promise<Reward> {
    this.rewards.set(reward.id, reward);
    return reward;
  }

  async findById(id: RewardId): Promise<Reward | null> {
    return this.rewards.get(id) ?? null;
  }

  async findByTripId(
    tripId: string,
    options?: { includeHidden?: boolean } & PaginationOptions,
  ): Promise<PaginatedResult<Reward>> {
    let items = Array.from(this.rewards.values()).filter(
      (r) => r.tripId === tripId,
    );

    if (!options?.includeHidden) {
      items = items.filter((r) => !r.isHidden);
    }

    const total = items.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 30;

    items = items.slice(offset, offset + limit);

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async findVisibleByTripId(
    tripId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<Reward>> {
    return this.findByTripId(tripId, { ...options, includeHidden: false });
  }

  async update(reward: Reward): Promise<Reward> {
    if (!this.rewards.has(reward.id)) {
      throw new Error(`Reward with id ${reward.id} not found`);
    }
    this.rewards.set(reward.id, reward);
    return reward;
  }

  async delete(id: RewardId): Promise<void> {
    this.rewards.delete(id);
  }

  async hasPurchases(id: RewardId): Promise<boolean> {
    return Array.from(this.purchases.values()).some((p) => p.rewardId === id);
  }

  async getPurchaseCount(id: RewardId): Promise<number> {
    return Array.from(this.purchases.values()).filter((p) => p.rewardId === id)
      .length;
  }

  async decrementQuantity(id: RewardId, amount: number): Promise<Reward> {
    const reward = await this.findById(id);
    if (!reward) {
      throw new Error(`Reward with id ${id} not found`);
    }
    const decremented = reward.decrementQuantity(amount);
    if (decremented.kind === "err") {
      throw new Error(decremented.error);
    }
    this.rewards.set(id, decremented.value);
    return decremented.value;
  }

  async incrementQuantity(id: RewardId, amount: number): Promise<Reward> {
    const reward = await this.findById(id);
    if (!reward) {
      throw new Error(`Reward with id ${id} not found`);
    }
    const incremented = reward.incrementQuantity(amount);
    if (incremented.kind === "err") {
      throw new Error(incremented.error);
    }
    this.rewards.set(id, incremented.value);
    return incremented.value;
  }
}

/**
 * In-Memory Reward Purchase Repository for Testing
 *
 * Implements RewardPurchaseRepository port with in-memory storage.
 */
export class InMemoryRewardPurchaseRepository implements RewardPurchaseRepository {
  private purchases = new Map<string, RewardPurchase>();

  reset(): void {
    this.purchases.clear();
  }

  seed(items: RewardPurchase[]): void {
    items.forEach((item) => this.purchases.set(item.id, item));
  }

  async create(purchase: RewardPurchase): Promise<RewardPurchase> {
    this.purchases.set(purchase.id, purchase);
    return purchase;
  }

  async findById(id: string): Promise<RewardPurchase | null> {
    return this.purchases.get(id) ?? null;
  }

  async findByRewardId(
    rewardId: RewardId,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<RewardPurchase>> {
    let items = Array.from(this.purchases.values()).filter(
      (p) => p.rewardId === rewardId,
    );

    const total = items.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 30;

    items = items.slice(offset, offset + limit);

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async findByGroupId(
    groupId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<RewardPurchase>> {
    let items = Array.from(this.purchases.values()).filter(
      (p) => p.groupId === groupId,
    );

    const total = items.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 30;

    items = items.slice(offset, offset + limit);

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async findByTripId(
    tripId: string,
    options?: { groupId?: string } & PaginationOptions,
  ): Promise<PaginatedResult<RewardPurchase>> {
    // This requires looking up rewards by tripId, then purchases by rewardId
    // For simplicity, we'll just filter by groupId if provided
    let items = Array.from(this.purchases.values());

    if (options?.groupId) {
      items = items.filter((p) => p.groupId === options.groupId);
    }

    const total = items.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 30;

    items = items.slice(offset, offset + limit);

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async updateStatus(
    id: string,
    status: string,
    updatedById: string,
    collectionMethod?: string | null,
  ): Promise<RewardPurchase> {
    const purchase = await this.findById(id);
    if (!purchase) {
      throw new Error(`Purchase with id ${id} not found`);
    }
    // Create updated purchase with new status
    const updated = new (purchase.constructor as new (
      ...args: unknown[]
    ) => RewardPurchase)(
      purchase.id,
      purchase.rewardId,
      purchase.groupId,
      purchase.quantity,
      purchase.totalCost,
      purchase.purchasedById,
      status as RewardPurchase["status"],
      purchase.purchasedAt,
      new Date(), // statusUpdatedAt
      updatedById,
      collectionMethod ?? purchase.collectionMethod,
    );
    this.purchases.set(id, updated);
    return updated;
  }

  async countByRewardId(rewardId: RewardId): Promise<number> {
    return this.findByRewardId(rewardId).then((result) => result.total);
  }
}
