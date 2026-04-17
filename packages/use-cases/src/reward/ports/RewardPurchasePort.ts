import { Context, Effect } from "effect";
import type {
  RewardPurchase,
  DatabaseError,
  TripId,
  RewardId,
  GroupId,
  RewardPurchaseId,
} from "@mirai-app/domain";

/**
 * Reward Purchase Port - Repository interface with Context.Tag for Effect DI
 */
export interface IRewardPurchasePort {
  findById(
    id: RewardPurchaseId,
  ): Effect.Effect<RewardPurchase | null, DatabaseError, never>;
  findByRewardId(
    rewardId: RewardId,
  ): Effect.Effect<RewardPurchase[], DatabaseError, never>;
  findByGroupId(
    groupId: GroupId,
  ): Effect.Effect<RewardPurchase[], DatabaseError, never>;
  findByTripId(
    tripId: TripId,
  ): Effect.Effect<RewardPurchase[], DatabaseError, never>;
  findPaginatedByTripId(
    tripId: TripId,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { purchases: RewardPurchase[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  >;
  findPaginatedByTripIdAndGroupId(
    tripId: TripId,
    groupId: GroupId,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { purchases: RewardPurchase[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  >;
  create(
    purchase: RewardPurchase,
  ): Effect.Effect<RewardPurchase, DatabaseError, never>;
  update(
    purchase: RewardPurchase,
  ): Effect.Effect<RewardPurchase, DatabaseError, never>;
  delete(id: RewardPurchaseId): Effect.Effect<void, DatabaseError, never>;
  exists(id: RewardPurchaseId): Effect.Effect<boolean, DatabaseError, never>;
  countByRewardId(
    rewardId: RewardId,
  ): Effect.Effect<number, DatabaseError, never>;
  countByTripId(tripId: TripId): Effect.Effect<number, DatabaseError, never>;
}

export class RewardPurchasePortTag extends Context.Tag("RewardPurchasePort")<
  RewardPurchasePortTag,
  IRewardPurchasePort
>() {}
