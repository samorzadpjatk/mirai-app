import type { RewardSelect, RewardInsert } from "../../infrastructure/drizzle";
import {
  Reward,
  RewardId,
  TripId,
  UserId,
  type ValidationError,
} from "@mirai-app/domain";
import type { Effect } from "effect";

/**
 * Reward Mapper
 *
 * Maps between database Reward records and domain Reward entities.
 */
export class RewardMapper {
  /**
   * Convert database record to domain entity
   */
  toDomain(
    dbReward: RewardSelect,
  ): Effect.Effect<Reward, ValidationError, never> {
    return Reward.create({
      id: RewardId.unsafeCreate(dbReward.id),
      name: dbReward.name,
      description: dbReward.description,
      availableQuantity: dbReward.availableQuantity,
      isHidden: dbReward.isHidden,
      image: dbReward.image ?? null,
      coinCost: dbReward.coinCost,
      tripId: TripId.unsafeCreate(dbReward.tripId),
      createdById: UserId.unsafeCreate(dbReward.createdById),
      createdAt: dbReward.createdAt,
      updatedAt: dbReward.updatedAt,
    });
  }

  /**
   * Convert domain entity to database insert format
   */
  toInsert(reward: Reward): RewardInsert {
    return {
      id: RewardId.toString(reward.id),
      name: reward.name,
      description: reward.description,
      availableQuantity: reward.availableQuantity,
      isHidden: reward.isHidden,
      image: reward.image,
      coinCost: reward.coinCost,
      tripId: TripId.toString(reward.tripId),
      createdById: UserId.toString(reward.createdById),
      createdAt: reward.createdAt,
      updatedAt: reward.updatedAt,
    };
  }

  /**
   * Convert domain entity to database update format
   */
  toUpdate(
    reward: Reward,
  ): Omit<RewardInsert, "id" | "tripId" | "createdById" | "createdAt"> {
    return {
      name: reward.name,
      description: reward.description,
      availableQuantity: reward.availableQuantity,
      isHidden: reward.isHidden,
      image: reward.image,
      coinCost: reward.coinCost,
      updatedAt: new Date(),
    };
  }
}

export const rewardMapper = new RewardMapper();
