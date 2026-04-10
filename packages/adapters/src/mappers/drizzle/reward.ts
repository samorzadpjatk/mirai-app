import {
  Reward,
  RewardPurchase,
  RewardPurchaseStatus,
} from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../gateways/base/repository";
import type {
  rewards,
  rewardPurchases,
  RewardSelect,
  RewardInsert,
  RewardPurchaseSelect,
  RewardPurchaseInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * RewardDrizzleMapper
 *
 * Maps between Drizzle database records and domain Reward entities.
 */
export class RewardDrizzleMapper implements DrizzleEntityMapper<
  Reward,
  RewardSelect,
  RewardInsert
> {
  toDomain(record: RewardSelect): Reward {
    const result = Reward.create({
      id: record.id,
      name: record.name,
      description: record.description,
      availableQuantity: record.availableQuantity,
      isHidden: record.isHidden,
      image: record.image,
      coinCost: record.coinCost,
      tripId: record.tripId,
      createdById: record.createdById,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    if (result.kind === "err") {
      throw new Error(`Failed to map Reward from Drizzle: ${result.error}`);
    }

    return result.value;
  }

  toDrizzleInsert(reward: Reward): RewardInsert {
    return {
      id: reward.id,
      name: reward.name,
      description: reward.description,
      availableQuantity: reward.availableQuantity,
      isHidden: reward.isHidden,
      image: reward.image,
      coinCost: reward.coinCost,
      tripId: reward.tripId,
      createdById: reward.createdById,
      createdAt: reward.createdAt,
      updatedAt: reward.updatedAt,
    };
  }

  toDrizzleUpdate(reward: Reward): Partial<RewardInsert> {
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

  static readonly instance = new RewardDrizzleMapper();
}

/**
 * RewardPurchaseDrizzleMapper
 *
 * Maps between Drizzle database records and domain RewardPurchase entities.
 */
export class RewardPurchaseDrizzleMapper implements DrizzleEntityMapper<
  RewardPurchase,
  RewardPurchaseSelect,
  RewardPurchaseInsert
> {
  toDomain(record: RewardPurchaseSelect): RewardPurchase {
    const status = this.mapStatusFromDrizzle(record.status);

    const result = RewardPurchase.create({
      id: record.id,
      rewardId: record.rewardId,
      groupId: record.groupId,
      quantity: record.quantity,
      totalCost: record.totalCost,
      status,
      collectionMethod: record.collectionMethod,
      purchasedById: record.purchasedById,
      statusUpdatedById: record.statusUpdatedById,
      statusUpdatedAt: record.statusUpdatedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    if (result.kind === "err") {
      throw new Error(
        `Failed to map RewardPurchase from Drizzle: ${result.error}`,
      );
    }

    return result.value;
  }

  toDrizzleInsert(purchase: RewardPurchase): RewardPurchaseInsert {
    return {
      id: purchase.id,
      rewardId: purchase.rewardId,
      groupId: purchase.groupId,
      quantity: purchase.quantity,
      totalCost: purchase.totalCost,
      status: purchase.status,
      collectionMethod: purchase.collectionMethod,
      purchasedById: purchase.purchasedById,
      statusUpdatedById: purchase.statusUpdatedById,
      statusUpdatedAt: purchase.statusUpdatedAt,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
    };
  }

  toDrizzleUpdate(purchase: RewardPurchase): Partial<RewardPurchaseInsert> {
    return {
      status: purchase.status,
      statusUpdatedById: purchase.statusUpdatedById,
      statusUpdatedAt: purchase.statusUpdatedAt,
      updatedAt: new Date(),
    };
  }

  private mapStatusFromDrizzle(status: string): RewardPurchaseStatus {
    return (
      RewardPurchaseStatus[status as keyof typeof RewardPurchaseStatus] ??
      RewardPurchaseStatus.BOUGHT
    );
  }

  static readonly instance = new RewardPurchaseDrizzleMapper();
}
