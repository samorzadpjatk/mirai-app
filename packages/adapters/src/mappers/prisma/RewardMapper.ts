import {
  Reward,
  RewardPurchase,
  RewardId,
  CoinAmount,
  type RewardPurchaseStatus,
} from "@mirai-app/domain";

/**
 * RewardMapper
 *
 * Maps between Prisma database records and domain Reward entities.
 * This is a pure function with no side effects.
 */
export class RewardMapper {
  /**
   * Convert a Prisma Reward record to a domain Reward entity
   */
  static toDomain(record: {
    id: string;
    name: string;
    description: string;
    availableQuantity: number;
    isHidden: boolean;
    image: string | null;
    coinCost: number;
    tripId: string;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  }): Reward {
    // Parse images from the image field (could be single URL or JSON array)
    const images = RewardMapper.parseImages(record.image);

    const result = Reward.create({
      id: RewardId.unsafeCreate(record.id),
      name: record.name,
      description: record.description,
      availableQuantity: record.availableQuantity,
      coinCostPercentage: record.coinCost,
      images,
      isHidden: record.isHidden,
      tripId: record.tripId,
      createdById: record.createdById,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    // This should never fail if database has valid data
    if (result.kind === "err") {
      throw new Error(`Failed to map Reward from database: ${result.error}`);
    }

    return result.value;
  }

  /**
   * Convert a domain Reward entity to Prisma create input
   */
  static toPrismaCreate(reward: Reward): {
    id: string;
    name: string;
    description: string;
    availableQuantity: number;
    isHidden: boolean;
    image: string | null;
    coinCost: number;
    tripId: string;
    createdById: string;
  } {
    return {
      id: reward.id,
      name: reward.name,
      description: reward.description,
      availableQuantity: reward.availableQuantity,
      isHidden: reward.isHidden,
      image: this.serializeImages(reward.images),
      coinCost: reward.coinCostPercentage.toNumber(),
      tripId: reward.tripId,
      createdById: reward.createdById,
    };
  }

  /**
   * Convert a domain Reward entity to Prisma update input
   */
  static toPrismaUpdate(reward: Reward): {
    name: string;
    description: string;
    availableQuantity: number;
    isHidden: boolean;
    image: string | null;
    coinCost: number;
    updatedAt: Date;
  } {
    return {
      name: reward.name,
      description: reward.description,
      availableQuantity: reward.availableQuantity,
      isHidden: reward.isHidden,
      image: this.serializeImages(reward.images),
      coinCost: reward.coinCostPercentage.toNumber(),
      updatedAt: new Date(),
    };
  }

  /**
   * Parse images from database format
   * Could be single URL or JSON array
   */
  private static parseImages(image: string | null | undefined): string[] {
    if (!image) return [];

    const trimmed = image.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter((value) => value.length > 0);
      }
    } catch {
      // Legacy single-image format
    }

    return [trimmed];
  }

  /**
   * Serialize images to database format
   * Returns single string for one image, JSON array for multiple
   */
  private static serializeImages(images: string[]): string | null {
    const filtered = images.map((i) => i.trim()).filter((i) => i.length > 0);

    if (filtered.length === 0) return null;
    if (filtered.length === 1) return filtered[0];
    return JSON.stringify(filtered);
  }
}

/**
 * RewardPurchaseMapper
 *
 * Maps between Prisma database records and domain RewardPurchase entities.
 */
export class RewardPurchaseMapper {
  /**
   * Convert a Prisma RewardPurchase record to a domain RewardPurchase entity
   */
  static toDomain(record: {
    id: string;
    rewardId: string;
    groupId: string;
    quantity: number;
    totalCost: number;
    status: string;
    collectionMethod: string | null;
    purchasedById: string;
    statusUpdatedById: string | null;
    statusUpdatedAt: Date;
    purchasedAt: Date;
  }): RewardPurchase {
    const result = RewardPurchase.create({
      id: record.id,
      rewardId: RewardId.unsafeCreate(record.rewardId),
      groupId: record.groupId,
      quantity: record.quantity,
      totalCost: record.totalCost,
      status: record.status as RewardPurchaseStatus,
      collectionMethod: record.collectionMethod,
      purchasedById: record.purchasedById,
      statusUpdatedById: record.statusUpdatedById,
      statusUpdatedAt: record.statusUpdatedAt,
      purchasedAt: record.purchasedAt,
    });

    if (result.kind === "err") {
      throw new Error(
        `Failed to map RewardPurchase from database: ${result.error}`,
      );
    }

    return result.value;
  }

  /**
   * Convert a domain RewardPurchase entity to Prisma create input
   */
  static toPrismaCreate(purchase: RewardPurchase): {
    id: string;
    rewardId: string;
    groupId: string;
    quantity: number;
    totalCost: number;
    status: string;
    collectionMethod: string | null;
    purchasedById: string;
    statusUpdatedById: string | null;
    statusUpdatedAt: Date;
    purchasedAt: Date;
  } {
    return {
      id: purchase.id,
      rewardId: purchase.rewardId,
      groupId: purchase.groupId,
      quantity: purchase.quantity,
      totalCost: purchase.totalCost.toNumber(),
      status: purchase.status,
      collectionMethod: purchase.collectionMethod,
      purchasedById: purchase.purchasedById,
      statusUpdatedById: purchase.statusUpdatedById,
      statusUpdatedAt: purchase.statusUpdatedAt,
      purchasedAt: purchase.purchasedAt,
    };
  }

  /**
   * Convert a domain RewardPurchase entity to Prisma update input (status only)
   */
  static toPrismaStatusUpdate(purchase: RewardPurchase): {
    status: string;
    statusUpdatedById: string;
    statusUpdatedAt: Date;
    collectionMethod?: string;
  } {
    const result: {
      status: string;
      statusUpdatedById: string;
      statusUpdatedAt: Date;
      collectionMethod?: string;
    } = {
      status: purchase.status,
      statusUpdatedById: purchase.statusUpdatedById ?? purchase.purchasedById,
      statusUpdatedAt: purchase.statusUpdatedAt,
    };

    if (purchase.collectionMethod) {
      result.collectionMethod = purchase.collectionMethod;
    }

    return result;
  }
}
