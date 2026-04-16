import type {
  RewardGateway,
  RewardPurchaseGateway,
  RewardDTO,
  RewardPurchaseDTO,
  RewardPaginatedResult,
  PurchasePaginatedResult,
  PaginationOptions,
} from "@mirai-app/use-cases";
import {
  type RewardId,
  type PurchaseId,
  RewardStatus,
} from "@mirai-app/domain";
import { Effect } from "effect";

/**
 * In-Memory Reward Gateway for Testing
 *
 * Implements RewardGateway port with in-memory storage.
 * Works with RewardDTOs for testing use cases.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryRewardGateway();
 * gateway.seed([mockRewardDTO]);
 *
 * const byTrip = await Effect.runPromise(gateway.findByTripId("trip-123"));
 * expect(byTrip.items).toHaveLength(1);
 *
 * gateway.reset();
 * ```
 */
export class InMemoryRewardGateway implements RewardGateway {
  private rewards = new Map<string, RewardDTO>();
  private purchases = new Map<string, RewardPurchaseDTO>();

  reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.rewards.clear();
      this.purchases.clear();
    });
  }

  seed(items: RewardDTO[]): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      items.forEach((item) => this.rewards.set(item.id, item));
    });
  }

  seedPurchases(
    purchases: RewardPurchaseDTO[],
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      purchases.forEach((p) => this.purchases.set(p.id, p));
    });
  }

  create(reward: RewardDTO): Effect.Effect<RewardDTO, never, never> {
    return Effect.sync(() => {
      this.rewards.set(reward.id, reward);
      return reward;
    });
  }

  findById(id: RewardId): Effect.Effect<RewardDTO | null, never, never> {
    return Effect.sync(() => this.rewards.get(id) ?? null);
  }

  findByTripId(
    tripId: string,
    options?: { includeHidden?: boolean } & PaginationOptions,
  ): Effect.Effect<RewardPaginatedResult, never, never> {
    return Effect.sync(() => {
      let items = Array.from(this.rewards.values()).filter(
        (r) => r.tripId === tripId,
      );

      if (!options?.includeHidden) {
        items = items.filter((r) => !r.isHidden);
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
  ): Effect.Effect<RewardPaginatedResult, never, never> {
    return this.findByTripId(tripId, { ...options, includeHidden: false });
  }

  update(reward: RewardDTO): Effect.Effect<RewardDTO, never, never> {
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
  ): Effect.Effect<RewardDTO, never, never> {
    return Effect.sync(() => {
      const reward = this.rewards.get(id);
      if (!reward) {
        throw new Error(`Reward with id ${id} not found`);
      }
      const updated: RewardDTO = {
        ...reward,
        availableQuantity: reward.availableQuantity - amount,
        updatedAt: new Date(),
      };
      this.rewards.set(id, updated);
      return updated;
    });
  }

  incrementQuantity(
    id: RewardId,
    amount: number,
  ): Effect.Effect<RewardDTO, never, never> {
    return Effect.sync(() => {
      const reward = this.rewards.get(id);
      if (!reward) {
        throw new Error(`Reward with id ${id} not found`);
      }
      const updated: RewardDTO = {
        ...reward,
        availableQuantity: reward.availableQuantity + amount,
        updatedAt: new Date(),
      };
      this.rewards.set(id, updated);
      return updated;
    });
  }

  findAvailableByTripId(
    tripId: string,
  ): Effect.Effect<RewardDTO[], never, never> {
    return Effect.sync(() => {
      return Array.from(this.rewards.values()).filter(
        (r) => r.tripId === tripId && !r.isHidden && r.availableQuantity > 0,
      );
    });
  }

  findByCreatorId(creatorId: string): Effect.Effect<RewardDTO[], never, never> {
    return Effect.sync(() => {
      return Array.from(this.rewards.values()).filter(
        (r) => r.createdById === creatorId,
      );
    });
  }

  hide(id: RewardId): Effect.Effect<RewardDTO, never, never> {
    return Effect.sync(() => {
      const reward = this.rewards.get(id);
      if (!reward) {
        throw new Error(`Reward with id ${id} not found`);
      }
      const updated: RewardDTO = {
        ...reward,
        isHidden: true,
        updatedAt: new Date(),
      };
      this.rewards.set(id, updated);
      return updated;
    });
  }

  unhide(id: RewardId): Effect.Effect<RewardDTO, never, never> {
    return Effect.sync(() => {
      const reward = this.rewards.get(id);
      if (!reward) {
        throw new Error(`Reward with id ${id} not found`);
      }
      const updated: RewardDTO = {
        ...reward,
        isHidden: false,
        updatedAt: new Date(),
      };
      this.rewards.set(id, updated);
      return updated;
    });
  }

  decrementAvailableQuantity(
    id: RewardId,
    amount: number,
  ): Effect.Effect<RewardDTO, never, never> {
    return this.decrementQuantity(id, amount);
  }

  countByTripId(tripId: string): Effect.Effect<number, never, never> {
    return Effect.succeed(
      Array.from(this.rewards.values()).filter((r) => r.tripId === tripId)
        .length,
    );
  }
}

/**
 * In-Memory Reward Purchase Gateway for Testing
 *
 * Implements RewardPurchaseGateway port with in-memory storage.
 * Works with RewardPurchaseDTOs for testing use cases.
 */
export class InMemoryRewardPurchaseGateway implements RewardPurchaseGateway {
  private purchases = new Map<string, RewardPurchaseDTO>();

  reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.purchases.clear();
    });
  }

  seed(items: RewardPurchaseDTO[]): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      items.forEach((item) => this.purchases.set(item.id, item));
    });
  }

  create(
    purchase: RewardPurchaseDTO,
  ): Effect.Effect<RewardPurchaseDTO, never, never> {
    return Effect.sync(() => {
      this.purchases.set(purchase.id, purchase);
      return purchase;
    });
  }

  findById(
    id: PurchaseId,
  ): Effect.Effect<RewardPurchaseDTO | null, never, never> {
    return Effect.succeed(this.purchases.get(id) ?? null);
  }

  findByRewardId(
    rewardId: RewardId,
    options?: PaginationOptions,
  ): Effect.Effect<PurchasePaginatedResult, never, never> {
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
  ): Effect.Effect<PurchasePaginatedResult, never, never> {
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
  ): Effect.Effect<PurchasePaginatedResult, never, never> {
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
    id: PurchaseId,
    status: string,
    updatedById: string,
    collectionMethod?: string | null,
  ): Effect.Effect<RewardPurchaseDTO, never, never> {
    return Effect.sync(() => {
      const purchase = this.purchases.get(id);
      if (!purchase) {
        throw new Error(`Purchase with id ${id} not found`);
      }
      const updated: RewardPurchaseDTO = {
        ...purchase,
        status: status as RewardPurchaseDTO["status"],
        collectionMethod: collectionMethod ?? purchase.collectionMethod,
        collectedById: updatedById,
        collectedAt: new Date(),
        updatedAt: new Date(),
      };
      this.purchases.set(id, updated);
      return updated;
    });
  }

  countByRewardId(rewardId: RewardId): Effect.Effect<number, never, never> {
    return Effect.succeed(
      Array.from(this.purchases.values()).filter((p) => p.rewardId === rewardId)
        .length,
    );
  }

  findByStatus(
    status: string,
    options?: PaginationOptions,
  ): Effect.Effect<PurchasePaginatedResult, never, never> {
    let items = Array.from(this.purchases.values()).filter(
      (p) => p.status === status,
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

  countByGroupId(groupId: string): Effect.Effect<number, never, never> {
    return Effect.succeed(
      Array.from(this.purchases.values()).filter((p) => p.groupId === groupId)
        .length,
    );
  }
}
