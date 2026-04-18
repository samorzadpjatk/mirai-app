import { Effect } from "effect";
import { Reward, RewardId, TripId, DatabaseError } from "@mirai-app/domain";
import type { IRewardPort } from "@mirai-app/domain";

/**
 * In-Memory Reward Gateway
 *
 * Implements IRewardPort using in-memory Map storage for testing.
 */
export class InMemoryRewardGateway implements IRewardPort {
  private rewards: Map<string, Reward> = new Map();

  findById(id: RewardId, _authToken?: string) {
    return Effect.sync(() => {
      const reward = this.rewards.get(RewardId.toString(id));
      return reward ?? null;
    });
  }

  findByTripId(tripId: TripId) {
    return Effect.sync(() => {
      return Array.from(this.rewards.values())
        .filter(
          (reward) =>
            TripId.toString(reward.tripId) === TripId.toString(tripId),
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  findAvailableByTripId(tripId: TripId) {
    return Effect.sync(() => {
      return Array.from(this.rewards.values())
        .filter((reward) => {
          const matchesTrip =
            TripId.toString(reward.tripId) === TripId.toString(tripId);
          const isAvailable = !reward.isHidden && reward.availableQuantity > 0;
          return matchesTrip && isAvailable;
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  create(reward: Reward, _authToken?: string) {
    return Effect.sync(() => {
      this.rewards.set(RewardId.toString(reward.id), reward);
      return reward;
    });
  }

  update(reward: Reward, _authToken?: string) {
    return Effect.sync(() => {
      this.rewards.set(RewardId.toString(reward.id), reward);
      return reward;
    });
  }

  delete(id: RewardId, _tripId: TripId, _authToken?: string) {
    return Effect.sync(() => {
      this.rewards.delete(RewardId.toString(id));
    });
  }

  exists(id: RewardId) {
    return Effect.sync(() => {
      return this.rewards.has(RewardId.toString(id));
    });
  }

  findPaginatedByTripId(
    tripId: TripId,
    params: { limit: number; offset: number },
  ) {
    return Effect.sync(() => {
      const tripIdStr = TripId.toString(tripId);
      const allForTrip = Array.from(this.rewards.values())
        .filter((reward) => TripId.toString(reward.tripId) === tripIdStr)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = allForTrip.length;
      const paginated = allForTrip.slice(
        params.offset,
        params.offset + params.limit,
      );

      return {
        rewards: paginated,
        total,
        hasMore: params.offset + paginated.length < total,
      };
    });
  }

  findAllPaginated(params: { limit: number; offset: number }) {
    return Effect.sync(() => {
      const all = Array.from(this.rewards.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      const total = all.length;
      const paginated = all.slice(params.offset, params.offset + params.limit);

      return {
        rewards: paginated,
        total,
        hasMore: params.offset + paginated.length < total,
      };
    });
  }

  countByTripId(tripId: TripId) {
    return Effect.sync(() => {
      const tripIdStr = TripId.toString(tripId);
      return Array.from(this.rewards.values()).filter(
        (reward) => TripId.toString(reward.tripId) === tripIdStr,
      ).length;
    });
  }

  /**
   * Helper method to add a reward (for testing)
   */
  addReward(reward: Reward): void {
    this.rewards.set(RewardId.toString(reward.id), reward);
  }

  /**
   * Helper method to clear all data (for testing)
   */
  clear(): void {
    this.rewards.clear();
  }
}
