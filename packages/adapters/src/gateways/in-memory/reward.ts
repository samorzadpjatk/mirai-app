import type {
  RewardRepository,
  RewardPurchaseRepository,
  PaginationOptions,
  PaginatedResult,
} from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/use-cases/ports/RewardRepository";
import {
  Reward,
  type RewardPurchase,
  type RewardId,
  CoinAmount,
} from "@mirai-app/domain";
import { Effect } from "effect";

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
 * const byTrip = await Effect.runPromise(repo.findByTripId("trip-123"));
 * expect(byTrip.items).toHaveLength(1);
 *
 * repo.reset();
 * ```
 */
export class InMemoryRewardRepository implements RewardRepository {
  private rewards = new Map<string, Reward>();
  private purchases = new Map<string, RewardPurchase>();

  /**
   * Reconstruct a Reward entity from plain object storage.
   * Uses reconstitute() factory to bypass validation and ensure proper instance.
   */
  private reconstruct(
    plain: unknown,
  ): Effect.Effect<Reward, DatabaseError, never> {
    const p = plain as Record<string, unknown>;
    try {
      const reward = Reward.reconstitute({
        id: p.id as RewardId,
        name: p.name as string,
        description: p.description as string | null,
        availableQuantity: p.availableQuantity as number,
        coinCostPercentage: p.coinCostPercentage as CoinAmount,
        images: p.images as string[],
        isHidden: p.isHidden as boolean,
        tripId: p.tripId as string,
        createdById: p.createdById as string,
        createdAt: p.createdAt as Date,
        updatedAt: p.updatedAt as Date,
      });
      return Effect.succeed(reward);
    } catch (error) {
      return Effect.fail(
        new DatabaseError({
          operation: "reconstruct",
          message: `Failed to reconstruct Reward: ${error instanceof Error ? error.message : String(error)}`,
        }),
      );
    }
  }

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

  create(reward: Reward): Effect.Effect<Reward, DatabaseError, never> {
    return Effect.sync(() => {
      this.rewards.set(reward.id, reward);
      return reward;
    });
  }

  findById(id: RewardId): Effect.Effect<Reward | null, DatabaseError, never> {
    return Effect.gen(this, function* () {
      const plain = this.rewards.get(id);
      if (!plain) return null;
      return yield* this.reconstruct(plain);
    });
  }

  findByTripId(
    tripId: string,
    options?: { includeHidden?: boolean } & PaginationOptions,
  ): Effect.Effect<PaginatedResult<Reward>, DatabaseError, never> {
    return Effect.gen(this, function* () {
      let plains = Array.from(this.rewards.values()).filter(
        (r) => (r as Record<string, unknown>).tripId === tripId,
      );

      if (!options?.includeHidden) {
        plains = plains.filter((r) => !(r as Record<string, unknown>).isHidden);
      }

      const total = plains.length;
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? 30;

      const sliced = plains.slice(offset, offset + limit);

      // Reconstruct all rewards to ensure proper instances
      const items: Reward[] = [];
      for (const plain of sliced) {
        const reward = yield* this.reconstruct(plain);
        items.push(reward);
      }

      return {
        items,
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      };
    });
  }

  findVisibleByTripId(
    tripId: string,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<Reward>, DatabaseError, never> {
    return this.findByTripId(tripId, { ...options, includeHidden: false });
  }

  update(reward: Reward): Effect.Effect<Reward, DatabaseError, never> {
    if (!this.rewards.has(reward.id)) {
      return Effect.fail(
        new DatabaseError({
          operation: "update",
          message: `Reward with id ${reward.id} not found`,
        }),
      );
    }
    this.rewards.set(reward.id, reward);
    return Effect.succeed(reward);
  }

  delete(id: RewardId): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      this.rewards.delete(id);
    });
  }

  hasPurchases(id: RewardId): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.succeed(
      Array.from(this.purchases.values()).some((p) => p.rewardId === id),
    );
  }

  getPurchaseCount(id: RewardId): Effect.Effect<number, DatabaseError, never> {
    return Effect.succeed(
      Array.from(this.purchases.values()).filter((p) => p.rewardId === id)
        .length,
    );
  }

  decrementQuantity(
    id: RewardId,
    amount: number,
  ): Effect.Effect<Reward, DatabaseError, never> {
    const reward = this.rewards.get(id);
    if (!reward) {
      return Effect.fail(
        new DatabaseError({
          operation: "decrementQuantity",
          message: `Reward with id ${id} not found`,
        }),
      );
    }
    return Effect.gen(this, function* () {
      const decremented = reward.decrementQuantity(amount);
      const result = yield* decremented;
      this.rewards.set(id, result);
      return result;
    });
  }

  incrementQuantity(
    id: RewardId,
    amount: number,
  ): Effect.Effect<Reward, DatabaseError, never> {
    const reward = this.rewards.get(id);
    if (!reward) {
      return Effect.fail(
        new DatabaseError({
          operation: "incrementQuantity",
          message: `Reward with id ${id} not found`,
        }),
      );
    }
    return Effect.gen(this, function* () {
      const incremented = reward.incrementQuantity(amount);
      const result = yield* incremented;
      this.rewards.set(id, result);
      return result;
    });
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

  create(
    purchase: RewardPurchase,
  ): Effect.Effect<RewardPurchase, DatabaseError, never> {
    return Effect.sync(() => {
      this.purchases.set(purchase.id, purchase);
      return purchase;
    });
  }

  findById(
    id: string,
  ): Effect.Effect<RewardPurchase | null, DatabaseError, never> {
    return Effect.succeed(this.purchases.get(id) ?? null);
  }

  findByRewardId(
    rewardId: RewardId,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<RewardPurchase>, DatabaseError, never> {
    let items = Array.from(this.purchases.values()).filter(
      (p) => p.rewardId === rewardId,
    );

    const total = items.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 30;

    items = items.slice(offset, offset + limit);

    return Effect.succeed({
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    });
  }

  findByGroupId(
    groupId: string,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<RewardPurchase>, DatabaseError, never> {
    let items = Array.from(this.purchases.values()).filter(
      (p) => p.groupId === groupId,
    );

    const total = items.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 30;

    items = items.slice(offset, offset + limit);

    return Effect.succeed({
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    });
  }

  findByTripId(
    tripId: string,
    options?: { groupId?: string } & PaginationOptions,
  ): Effect.Effect<PaginatedResult<RewardPurchase>, DatabaseError, never> {
    let items = Array.from(this.purchases.values());

    if (options?.groupId) {
      items = items.filter((p) => p.groupId === options.groupId);
    }

    const total = items.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 30;

    items = items.slice(offset, offset + limit);

    return Effect.succeed({
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    });
  }

  updateStatus(
    id: string,
    status: string,
    updatedById: string,
    collectionMethod?: string | null,
  ): Effect.Effect<RewardPurchase, DatabaseError, never> {
    const purchase = this.purchases.get(id);
    if (!purchase) {
      return Effect.fail(
        new DatabaseError({
          operation: "updateStatus",
          message: `Purchase with id ${id} not found`,
        }),
      );
    }
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
      new Date(),
      updatedById,
      collectionMethod ?? purchase.collectionMethod,
    );
    this.purchases.set(id, updated);
    return Effect.succeed(updated);
  }

  countByRewardId(
    rewardId: RewardId,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.succeed(
      Array.from(this.purchases.values()).filter((p) => p.rewardId === rewardId)
        .length,
    );
  }
}
