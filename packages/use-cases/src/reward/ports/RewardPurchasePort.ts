import { Context, Effect } from "effect";
import type {
  RewardPurchase,
  IPortError,
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
  ): Effect.Effect<RewardPurchase | null, IPortError, never>;
  findByRewardId(
    rewardId: RewardId,
  ): Effect.Effect<RewardPurchase[], IPortError, never>;
  findByGroupId(
    groupId: GroupId,
  ): Effect.Effect<RewardPurchase[], IPortError, never>;
  findByTripId(
    tripId: TripId,
  ): Effect.Effect<RewardPurchase[], IPortError, never>;
  findPaginatedByTripId(
    tripId: TripId,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { purchases: RewardPurchase[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;
  findPaginatedByTripIdAndGroupId(
    tripId: TripId,
    groupId: GroupId,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { purchases: RewardPurchase[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;
  create(
    purchase: RewardPurchase,
  ): Effect.Effect<RewardPurchase, IPortError, never>;
  update(
    purchase: RewardPurchase,
  ): Effect.Effect<RewardPurchase, IPortError, never>;
  delete(id: RewardPurchaseId): Effect.Effect<void, IPortError, never>;
  exists(id: RewardPurchaseId): Effect.Effect<boolean, IPortError, never>;
  countByRewardId(rewardId: RewardId): Effect.Effect<number, IPortError, never>;
  countByTripId(tripId: TripId): Effect.Effect<number, IPortError, never>;
}

export class RewardPurchasePortTag extends Context.Tag("RewardPurchasePort")<
  RewardPurchasePortTag,
  IRewardPurchasePort
>() {}
