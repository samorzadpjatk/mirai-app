import type {
  RewardRepository,
  RewardPurchaseRepository,
  PaginationOptions,
  PaginatedResult,
} from "@repo/use-cases";
import type { Reward, RewardPurchase, RewardId } from "@repo/domain";
import type { PrismaClient } from "@repo/frameworks/prisma/client";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { RewardMapper, RewardPurchaseMapper } from "../mappers/RewardMapper";

// Type definitions for Prisma inputs/outputs
type PrismaReward = {
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
};

type PrismaRewardCreateInput = {
  id: string;
  name: string;
  description: string;
  availableQuantity: number;
  isHidden: boolean;
  image: string | null;
  coinCost: number;
  tripId: string;
  createdById: string;
};

type PrismaRewardUpdateInput = {
  name: string;
  description: string;
  availableQuantity: number;
  isHidden: boolean;
  image: string | null;
  coinCost: number;
  updatedAt: Date;
};

type PrismaPurchaseRecord = {
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
};

/**
 * Adapter to make RewardMapper compatible with EntityMapper interface
 */
const RewardMapperAdapter: EntityMapper<
  Reward,
  PrismaReward,
  PrismaRewardCreateInput,
  PrismaRewardUpdateInput
> = {
  toDomain: RewardMapper.toDomain,
  toPrismaCreate: RewardMapper.toPrismaCreate,
  toPrismaUpdate: RewardMapper.toPrismaUpdate,
};

/**
 * PrismaRewardRepository
 *
 * Implements the RewardRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 *
 * @example
 * ```typescript
 * const rewardRepo = new PrismaRewardRepository(prisma);
 * const reward = await rewardRepo.findById("reward-123");
 * ```
 */
export class PrismaRewardRepository
  extends BasePrismaRepository<
    Reward,
    PrismaReward,
    PrismaRewardCreateInput,
    PrismaRewardUpdateInput
  >
  implements RewardRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma, { model: prisma.reward }, RewardMapperAdapter);
  }

  /**
   * Find all rewards for a trip with optional visibility filtering
   */
  async findByTripId(
    tripId: string,
    options?: { includeHidden?: boolean } & PaginationOptions,
  ): Promise<PaginatedResult<Reward>> {
    const limit = options?.limit ?? 30;
    const offset = options?.offset ?? 0;

    const where = {
      tripId,
      ...(options?.includeHidden ? {} : { isHidden: false }),
    };

    const [records, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.model.count({ where }),
    ]);

    return {
      items: records.map((record) => this.mapper.toDomain(record)),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Find all visible (not hidden) rewards for a trip
   */
  async findVisibleByTripId(
    tripId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<Reward>> {
    return this.findByTripId(tripId, { ...options, includeHidden: false });
  }

  /**
   * Check if reward has any purchases
   */
  async hasPurchases(id: RewardId): Promise<boolean> {
    const count = await this.prisma.rewardPurchase.count({
      where: { rewardId: id },
    });

    return count > 0;
  }

  /**
   * Get purchase count for a reward
   */
  async getPurchaseCount(id: RewardId): Promise<number> {
    return this.prisma.rewardPurchase.count({
      where: { rewardId: id },
    });
  }

  /**
   * Decrement available quantity (atomic operation)
   * Used during purchase transactions
   */
  async decrementQuantity(id: RewardId, amount: number): Promise<Reward> {
    const record = await this.prisma.reward.update({
      where: { id },
      data: {
        availableQuantity: { decrement: amount },
        updatedAt: new Date(),
      },
    });

    return this.mapper.toDomain(record);
  }

  /**
   * Increment available quantity (atomic operation)
   * Used during refund/cancellation
   */
  async incrementQuantity(id: RewardId, amount: number): Promise<Reward> {
    const record = await this.prisma.reward.update({
      where: { id },
      data: {
        availableQuantity: { increment: amount },
        updatedAt: new Date(),
      },
    });

    return this.mapper.toDomain(record);
  }
}

/**
 * PrismaRewardPurchaseRepository
 *
 * Implements the RewardPurchaseRepository port using Prisma ORM.
 * This is a separate repository for managing reward purchases.
 */
export class PrismaRewardPurchaseRepository implements RewardPurchaseRepository {
  constructor(private prisma: PrismaClient) {}

  async create(purchase: RewardPurchase): Promise<RewardPurchase> {
    const record = await this.prisma.rewardPurchase.create({
      data: RewardPurchaseMapper.toPrismaCreate(purchase),
    });

    return RewardPurchaseMapper.toDomain(record);
  }

  async findById(id: string): Promise<RewardPurchase | null> {
    const record = await this.prisma.rewardPurchase.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return RewardPurchaseMapper.toDomain(record);
  }

  async findByRewardId(
    rewardId: RewardId,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<RewardPurchase>> {
    const limit = options?.limit ?? 30;
    const offset = options?.offset ?? 0;

    const [records, total] = await Promise.all([
      this.prisma.rewardPurchase.findMany({
        where: { rewardId },
        orderBy: { purchasedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.rewardPurchase.count({ where: { rewardId } }),
    ]);

    return {
      items: records.map((record) => RewardPurchaseMapper.toDomain(record)),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  async findByGroupId(
    groupId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<RewardPurchase>> {
    const limit = options?.limit ?? 30;
    const offset = options?.offset ?? 0;

    const [records, total] = await Promise.all([
      this.prisma.rewardPurchase.findMany({
        where: { groupId },
        orderBy: { purchasedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.rewardPurchase.count({ where: { groupId } }),
    ]);

    return {
      items: records.map((record) => RewardPurchaseMapper.toDomain(record)),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  async findByTripId(
    tripId: string,
    options?: { groupId?: string } & PaginationOptions,
  ): Promise<PaginatedResult<RewardPurchase>> {
    const limit = options?.limit ?? 30;
    const offset = options?.offset ?? 0;

    const where = {
      reward: { tripId },
      ...(options?.groupId ? { groupId: options.groupId } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.rewardPurchase.findMany({
        where,
        orderBy: { purchasedAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          reward: { select: { name: true } },
          group: { select: { name: true } },
          purchasedBy: { select: { firstName: true, lastName: true } },
          statusUpdatedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.rewardPurchase.count({ where }),
    ]);

    return {
      items: records.map((record) => RewardPurchaseMapper.toDomain(record)),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  async updateStatus(
    id: string,
    status: string,
    updatedById: string,
    collectionMethod?: string | null,
  ): Promise<RewardPurchase> {
    const data: Record<string, unknown> = {
      status,
      statusUpdatedById: updatedById,
      statusUpdatedAt: new Date(),
    };

    if (collectionMethod !== undefined && collectionMethod !== null) {
      data.collectionMethod = collectionMethod;
    }

    const record = await this.prisma.rewardPurchase.update({
      where: { id },
      data,
    });

    return RewardPurchaseMapper.toDomain(record);
  }

  async countByRewardId(rewardId: RewardId): Promise<number> {
    return this.prisma.rewardPurchase.count({
      where: { rewardId },
    });
  }
}
