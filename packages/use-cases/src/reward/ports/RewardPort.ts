import { Context, Effect } from "effect";
import type { Reward, IPortError, TripId, RewardId } from "@mirai-app/domain";

/**
 * Reward Port - Repository interface with Context.Tag for Effect DI
 */
export interface IRewardPort {
  findById(id: RewardId): Effect.Effect<Reward | null, IPortError, never>;
  findByTripId(tripId: TripId): Effect.Effect<Reward[], IPortError, never>;
  findAvailableByTripId(
    tripId: TripId,
  ): Effect.Effect<Reward[], IPortError, never>;
  findPaginatedByTripId(
    tripId: TripId,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { rewards: Reward[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;
  findAllPaginated(params: {
    limit: number;
    offset: number;
  }): Effect.Effect<
    { rewards: Reward[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;
  create(reward: Reward): Effect.Effect<Reward, IPortError, never>;
  update(reward: Reward): Effect.Effect<Reward, IPortError, never>;
  delete(id: RewardId): Effect.Effect<void, IPortError, never>;
  exists(id: RewardId): Effect.Effect<boolean, IPortError, never>;
  countByTripId(tripId: TripId): Effect.Effect<number, IPortError, never>;
}

export class RewardPortTag extends Context.Tag("RewardPort")<
  RewardPortTag,
  IRewardPort
>() {}
