import type {
  RewardPurchaseSelect,
  RewardPurchaseInsert,
} from "@mirai-app/frameworks/drizzle";
import {
  RewardPurchase,
  RewardPurchaseId,
  RewardId,
  GroupId,
  UserId,
  type ValidationError,
  type RewardPurchaseStatus,
} from "@mirai-app/domain";
import type { Effect } from "effect";

/**
 * Reward Purchase Mapper
 *
 * Maps between database RewardPurchase records and domain RewardPurchase entities.
 */
export class RewardPurchaseMapper {
  /**
   * Convert database record to domain entity
   */
  toDomain(
    dbPurchase: RewardPurchaseSelect,
  ): Effect.Effect<RewardPurchase, ValidationError, never> {
    return RewardPurchase.create({
      id: RewardPurchaseId.unsafeCreate(dbPurchase.id),
      rewardId: RewardId.unsafeCreate(dbPurchase.rewardId),
      groupId: GroupId.unsafeCreate(dbPurchase.groupId),
      quantity: dbPurchase.quantity,
      totalCost: dbPurchase.totalCost,
      status: dbPurchase.status as RewardPurchaseStatus,
      purchasedById: UserId.unsafeCreate(dbPurchase.purchasedById),
      statusUpdatedById: dbPurchase.statusUpdatedById
        ? UserId.unsafeCreate(dbPurchase.statusUpdatedById)
        : null,
      statusUpdatedAt: dbPurchase.statusUpdatedAt ?? null,
      collectionMethod: dbPurchase.collectionMethod ?? null,
      purchasedAt: dbPurchase.createdAt,
      createdAt: dbPurchase.createdAt,
      updatedAt: dbPurchase.updatedAt,
    });
  }

  /**
   * Convert domain entity to database insert format
   */
  toInsert(purchase: RewardPurchase): RewardPurchaseInsert {
    return {
      id: RewardPurchaseId.toString(purchase.id),
      rewardId: RewardId.toString(purchase.rewardId),
      groupId: GroupId.toString(purchase.groupId),
      quantity: purchase.quantity,
      totalCost: purchase.totalCost,
      status: purchase.status,
      purchasedById: UserId.toString(purchase.purchasedById),
      statusUpdatedById: purchase.statusUpdatedById
        ? UserId.toString(purchase.statusUpdatedById)
        : null,
      statusUpdatedAt: purchase.statusUpdatedAt,
      collectionMethod: purchase.collectionMethod,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
    };
  }

  /**
   * Convert domain entity to database update format
   */
  toUpdate(
    purchase: RewardPurchase,
  ): Omit<RewardPurchaseInsert, "id" | "rewardId" | "groupId" | "createdAt"> {
    return {
      quantity: purchase.quantity,
      totalCost: purchase.totalCost,
      status: purchase.status,
      purchasedById: UserId.toString(purchase.purchasedById),
      statusUpdatedById: purchase.statusUpdatedById
        ? UserId.toString(purchase.statusUpdatedById)
        : null,
      statusUpdatedAt: purchase.statusUpdatedAt,
      collectionMethod: purchase.collectionMethod,
      updatedAt: new Date(),
    };
  }
}

export const rewardPurchaseMapper = new RewardPurchaseMapper();
