import { Effect } from "effect";
import {
  RewardPurchase,
  RewardPurchaseId,
  RewardId,
  GroupId,
  TripId,
  DatabaseError,
} from "@mirai-app/domain";
import type { IRewardPurchasePort } from "@mirai-app/domain";

/**
 * In-Memory Reward Purchase Gateway
 *
 * Implements IRewardPurchasePort using in-memory Map storage for testing.
 */
export class InMemoryRewardPurchaseGateway implements IRewardPurchasePort {
  private purchases: Map<string, RewardPurchase> = new Map();

  findById(id: RewardPurchaseId) {
    return Effect.sync(() => {
      const purchase = this.purchases.get(RewardPurchaseId.toString(id));
      return purchase ?? null;
    });
  }

  findByRewardId(rewardId: RewardId) {
    return Effect.sync(() => {
      return Array.from(this.purchases.values())
        .filter(
          (purchase) =>
            RewardId.toString(purchase.rewardId) ===
            RewardId.toString(rewardId),
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  findByGroupId(groupId: GroupId) {
    return Effect.sync(() => {
      return Array.from(this.purchases.values())
        .filter(
          (purchase) =>
            GroupId.toString(purchase.groupId) === GroupId.toString(groupId),
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  findByTripId(tripId: TripId) {
    // Note: In-memory implementation cannot easily join with rewards table
    // This is a limitation - in real usage, use the Drizzle implementation
    return Effect.sync(() => {
      return Array.from(this.purchases.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    });
  }

  findPaginatedByTripId(
    tripId: TripId,
    params: { limit: number; offset: number },
  ) {
    return Effect.sync(() => {
      // Note: In-memory implementation cannot easily join with rewards table
      // This is a limitation - in real usage, use the Drizzle implementation
      const allPurchases = Array.from(this.purchases.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      const total = allPurchases.length;
      const paginated = allPurchases.slice(
        params.offset,
        params.offset + params.limit,
      );

      return {
        purchases: paginated,
        total,
        hasMore: params.offset + paginated.length < total,
      };
    });
  }

  findPaginatedByTripIdAndGroupId(
    _tripId: TripId,
    groupId: GroupId,
    params: { limit: number; offset: number },
  ) {
    return Effect.sync(() => {
      const allPurchases = Array.from(this.purchases.values())
        .filter(
          (purchase) =>
            GroupId.toString(purchase.groupId) === GroupId.toString(groupId),
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = allPurchases.length;
      const paginated = allPurchases.slice(
        params.offset,
        params.offset + params.limit,
      );

      return {
        purchases: paginated,
        total,
        hasMore: params.offset + paginated.length < total,
      };
    });
  }

  create(purchase: RewardPurchase) {
    return Effect.sync(() => {
      this.purchases.set(RewardPurchaseId.toString(purchase.id), purchase);
      return purchase;
    });
  }

  update(purchase: RewardPurchase) {
    return Effect.sync(() => {
      this.purchases.set(RewardPurchaseId.toString(purchase.id), purchase);
      return purchase;
    });
  }

  delete(id: RewardPurchaseId) {
    return Effect.sync(() => {
      this.purchases.delete(RewardPurchaseId.toString(id));
    });
  }

  exists(id: RewardPurchaseId) {
    return Effect.sync(() => {
      return this.purchases.has(RewardPurchaseId.toString(id));
    });
  }

  countByRewardId(rewardId: RewardId) {
    return Effect.sync(() => {
      return Array.from(this.purchases.values()).filter(
        (purchase) =>
          RewardId.toString(purchase.rewardId) === RewardId.toString(rewardId),
      ).length;
    });
  }

  countByTripId(tripId: TripId) {
    // Note: In-memory implementation cannot easily join with rewards table
    return Effect.sync(() => {
      return this.purchases.size;
    });
  }

  /**
   * Helper method to add a purchase (for testing)
   */
  addPurchase(purchase: RewardPurchase): void {
    this.purchases.set(RewardPurchaseId.toString(purchase.id), purchase);
  }

  /**
   * Helper method to clear all data (for testing)
   */
  clear(): void {
    this.purchases.clear();
  }
}
