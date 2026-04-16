import { RewardPurchaseStatus, RewardStatus } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../../../system/shared/gateways/drizzle-base";
import type {
  rewards,
  rewardPurchases,
  RewardSelect,
  RewardInsert,
  RewardPurchaseSelect,
  RewardPurchaseInsert,
} from "@mirai-app/frameworks/drizzle";
import type { RewardDTO, RewardPurchaseDTO } from "@mirai-app/use-cases";

/**
 * RewardDrizzleMapper
 *
 * Maps between Drizzle database records, domain Reward entities, and DTOs.
 */
export class RewardDrizzleMapper implements DrizzleEntityMapper<
  RewardDTO,
  RewardSelect,
  RewardInsert
> {
  /**
   * Convert a Drizzle Reward record to a RewardDTO
   */
  toDTO(record: RewardSelect): RewardDTO {
    return {
      id: record.id,
      tripId: record.tripId,
      title: record.name,
      description: record.description,
      imageUrl: record.image,
      pointsCost: 0, // Will be calculated by service
      quantity: record.availableQuantity,
      availableQuantity: record.availableQuantity,
      status: RewardStatus.AVAILABLE,
      isHidden: record.isHidden,
      createdById: record.createdById,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Convert a RewardDTO to Drizzle insert input
   */
  toDrizzleInsert(dto: RewardDTO): RewardInsert {
    return {
      id: dto.id,
      name: dto.title,
      description: dto.description,
      availableQuantity: dto.availableQuantity,
      isHidden: dto.isHidden,
      image: dto.imageUrl,
      tripId: dto.tripId,
      createdById: dto.createdById,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    } as any;
  }

  /**
   * Convert a RewardDTO to Drizzle update input
   */
  toDrizzleUpdate(dto: RewardDTO): Partial<RewardInsert> {
    return {
      name: dto.title,
      description: dto.description,
      availableQuantity: dto.availableQuantity,
      isHidden: dto.isHidden,
      image: dto.imageUrl,
      updatedAt: new Date(),
    } as any;
  }

  static readonly instance = new RewardDrizzleMapper();
}

/**
 * RewardPurchaseDrizzleMapper
 *
 * Maps between Drizzle database records, domain RewardPurchase entities, and DTOs.
 */
export class RewardPurchaseDrizzleMapper implements DrizzleEntityMapper<
  RewardPurchaseDTO,
  RewardPurchaseSelect,
  RewardPurchaseInsert
> {
  /**
   * Convert a Drizzle RewardPurchase record to a RewardPurchaseDTO
   */
  toDTO(record: RewardPurchaseSelect): RewardPurchaseDTO {
    return {
      id: record.id,
      rewardId: record.rewardId,
      groupId: record.groupId,
      userId: record.purchasedById,
      pointsSpent: record.totalCost,
      status: this.mapStatusToDTO(record.status),
      quantity: record.quantity,
      collectionMethod: record.collectionMethod,
      collectedAt: record.statusUpdatedAt,
      collectedById: record.statusUpdatedById,
      notes: null,
      purchasedAt: (record as any).createdAt ?? new Date(),
      updatedAt: (record as any).updatedAt ?? new Date(),
    };
  }

  /**
   * Convert a RewardPurchaseDTO to Drizzle insert input
   */
  toDrizzleInsert(dto: RewardPurchaseDTO): RewardPurchaseInsert {
    return {
      id: dto.id,
      rewardId: dto.rewardId,
      groupId: dto.groupId,
      quantity: dto.quantity,
      totalCost: dto.pointsSpent,
      status: dto.status,
      collectionMethod: dto.collectionMethod,
      purchasedById: dto.userId,
      statusUpdatedById: dto.collectedById,
      statusUpdatedAt: dto.collectedAt,
      createdAt: dto.purchasedAt,
      updatedAt: dto.updatedAt,
    } as RewardPurchaseInsert;
  }

  /**
   * Convert a RewardPurchaseDTO to Drizzle update input
   */
  toDrizzleUpdate(dto: RewardPurchaseDTO): Partial<RewardPurchaseInsert> {
    return {
      status: dto.status,
      collectionMethod: dto.collectionMethod,
      statusUpdatedById: dto.collectedById,
      statusUpdatedAt: dto.collectedAt,
      updatedAt: new Date(),
    } as Partial<RewardPurchaseInsert>;
  }

  private mapStatusToDTO(status: string): RewardPurchaseStatus {
    return (
      RewardPurchaseStatus[status as keyof typeof RewardPurchaseStatus] ??
      RewardPurchaseStatus.BOUGHT
    );
  }

  static readonly instance = new RewardPurchaseDrizzleMapper();
}
