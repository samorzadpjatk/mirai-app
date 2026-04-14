import type {
  RewardRepository,
  RewardPurchaseRepository,
  PaginationOptions,
  PaginatedResult,
} from "@mirai-app/use-cases";
import { Reward, type RewardPurchase, type RewardId } from "@mirai-app/domain";
import { Effect } from "effect";
import { DatabaseError } from "./base";

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

  reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.rewards.clear();
      this.purchases.clear();
    });
  }

  seed(items: Reward[]): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      items.forEach((item) => this.rewards.set(item.id, item));
    });
  }

  seedPurchases(
    purchases: RewardPurchase[],
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      purchases.forEach((p) => this.purchases.set(p.id, p));
    });
  }

  create(reward: Reward): Effect.Effect<Reward, never, never> {
    return Effect.sync(() => {
      this.rewards.set(reward.id, reward);
      return reward;
    });
  }

  findById(id: RewardId): Effect.Effect<Reward | null, never, never> {
    return Effect.sync(() => this.rewards.get(id) ?? null);
  }

  findByTripId(
    tripId: string,
    options?: { includeHidden?: boolean } & PaginationOptions,
  ): Effect.Effect<PaginatedResult<Reward>, never, never> {
    return Effect.sync(() => {
      let items = Array.from(this.rewards.values()).filter(
        (r) => (r as unknown as Record<string, unknown>).tripId === tripId,
      );

      if (!options?.includeHidden) {
        items = items.filter(
          (r) => !(r as unknown as Record<string, unknown>).isHidden,
        );
      }

      const total = items.length;
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? 30;

      const sliced = items.slice(offset, offset + limit);

      return {
        items: sliced,
        total,
        limit,
        offset,
        hasMore: offset + sliced.length < total,
      };
    });
  }

  findVisibleByTripId(
    tripId: string,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<Reward>, never, never> {
    return this.findByTripId(tripId, { ...options, includeHidden: false });
  }

  update(reward: Reward): Effect.Effect<Reward, never, never> {
    return Effect.sync(() => {
      this.rewards.set(reward.id, reward);
      return reward;
    });
  }

  delete(id: RewardId): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.rewards.delete(id);
    });
  }

  hasPurchases(id: RewardId): Effect.Effect<boolean, never, never> {
    return Effect.succeed(
      Array.from(this.purchases.values()).some((p) => p.rewardId === id),
    );
  }

  getPurchaseCount(id: RewardId): Effect.Effect<number, never, never> {
    return Effect.succeed(
      Array.from(this.purchases.values()).filter((p) => p.rewardId === id)
        .length,
    );
  }

  decrementQuantity(
    id: RewardId,
    amount: number,
  ): Effect.Effect<Reward, never, never> {
    const reward = this.rewards.get(id);
    if (!reward) {
      throw new Error(`Reward with id ${id} not found`);
    }
    return Effect.gen(this, function* () {
      const decremented = reward.decrementQuantity(amount);
      const result = yield* decremented.pipe(Effect.orDie);
      this.rewards.set(id, result);
      return result;
    });
  }

  incrementQuantity(
    id: RewardId,
    amount: number,
  ): Effect.Effect<Reward, never, never> {
    const reward = this.rewards.get(id);
    if (!reward) {
      throw new Error(`Reward with id ${id} not found`);
    }
    return Effect.gen(this, function* () {
      const incremented = reward.incrementQuantity(amount);
      const result = yield* incremented.pipe(Effect.orDie);
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

  reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.purchases.clear();
    });
  }

  seed(items: RewardPurchase[]): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      items.forEach((item) => this.purchases.set(item.id, item));
    });
  }

  create(
    purchase: RewardPurchase,
  ): Effect.Effect<RewardPurchase, never, never> {
    return Effect.sync(() => {
      this.purchases.set(purchase.id, purchase);
      return purchase;
    });
  }

  findById(id: string): Effect.Effect<RewardPurchase | null, never, never> {
    return Effect.succeed(this.purchases.get(id) ?? null);
  }

  findByRewardId(
    rewardId: RewardId,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<RewardPurchase>, never, never> {
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
  ): Effect.Effect<PaginatedResult<RewardPurchase>, never, never> {
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
  ): Effect.Effect<PaginatedResult<RewardPurchase>, never, never> {
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
  ): Effect.Effect<RewardPurchase, never, never> {
    const purchase = this.purchases.get(id);
    if (!purchase) {
      throw new Error(`Purchase with id ${id} not found`);
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

  countByRewardId(rewardId: RewardId): Effect.Effect<number, never, never> {
    return Effect.succeed(
      Array.from(this.purchases.values()).filter((p) => p.rewardId === rewardId)
        .length,
    );
  }
}
