import { Context, Effect } from "effect";
import type {
  Reward,
  DatabaseError,
  TripId,
  RewardId,
} from "@mirai-app/domain";

/**
 * Reward Port - Repository interface with Context.Tag for Effect DI
 */
export interface IRewardPort {
  findById(id: RewardId): Effect.Effect<Reward | null, DatabaseError, never>;
  findByTripId(tripId: TripId): Effect.Effect<Reward[], DatabaseError, never>;
  findAvailableByTripId(
    tripId: TripId,
  ): Effect.Effect<Reward[], DatabaseError, never>;
  findPaginatedByTripId(
    tripId: TripId,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { rewards: Reward[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  >;
  findAllPaginated(params: {
    limit: number;
    offset: number;
  }): Effect.Effect<
    { rewards: Reward[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  >;
  create(reward: Reward): Effect.Effect<Reward, DatabaseError, never>;
  update(reward: Reward): Effect.Effect<Reward, DatabaseError, never>;
  delete(id: RewardId): Effect.Effect<void, DatabaseError, never>;
  exists(id: RewardId): Effect.Effect<boolean, DatabaseError, never>;
  countByTripId(tripId: TripId): Effect.Effect<number, DatabaseError, never>;
}

export class RewardPortTag extends Context.Tag("RewardPort")<
  RewardPortTag,
  IRewardPort
>() {}
