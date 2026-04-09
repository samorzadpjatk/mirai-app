import type { PrismaClient } from "@repo/frameworks/prisma";
import type {
  CoinTransactionRepository,
  CoinTransaction,
  CoinTransactionFilters,
  PaginationOptions,
  MostActiveAdminStat,
} from "@repo/use-cases";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { CoinTransactionMapper } from "../mappers/CoinTransactionMapper";

// Type definitions for Prisma inputs/outputs
type PrismaCoinTransaction = {
  id: string;
  groupId: string;
  amount: number;
  reason: string | null;
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaCoinTransactionCreateInput = {
  id?: string;
  groupId: string;
  amount: number;
  reason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  adminId: string;
};

type PrismaCoinTransactionUpdateInput = {
  groupId?: string;
  amount?: number;
  reason?: string | null;
  updatedAt?: Date;
  adminId?: string;
};

/**
 * Adapter to make CoinTransactionMapper compatible with EntityMapper interface
 */
const CoinTransactionMapperAdapter: EntityMapper<
  CoinTransaction,
  PrismaCoinTransaction,
  PrismaCoinTransactionCreateInput,
  PrismaCoinTransactionUpdateInput
> = {
  toDomain: CoinTransactionMapper.toDomain,
  toPrismaCreate: CoinTransactionMapper.toPrismaCreate,
  toPrismaUpdate: CoinTransactionMapper.toPrismaUpdate,
};

/**
 * PrismaCoinTransactionRepository
 *
 * Implements the CoinTransactionRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 *
 * Note: Statistics and aggregation methods remain as custom implementations
 * since they don't fit the standard CRUD pattern.
 *
 * @example
 * ```typescript
 * const repo = new PrismaCoinTransactionRepository(prisma);
 * const transaction = await repo.findById("transaction-123");
 * const stats = await repo.getMostActiveAdmin("trip-123");
 * ```
 */
export class PrismaCoinTransactionRepository
  extends BasePrismaRepository<
    CoinTransaction,
    PrismaCoinTransaction,
    PrismaCoinTransactionCreateInput,
    PrismaCoinTransactionUpdateInput
  >
  implements CoinTransactionRepository
{
  constructor(prisma: PrismaClient) {
    super(
      prisma,
      { model: prisma.coinTransaction },
      CoinTransactionMapperAdapter,
    );
  }

  // ============================================================================
  // Statistics & Aggregation Methods (Custom - not inherited from base)
  // ============================================================================

  async count(filters?: Partial<CoinTransactionFilters>): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.model.count({ where });
  }

  async sumAmount(
    filters?: Partial<CoinTransactionFilters>,
  ): Promise<number | null> {
    const where = this.buildWhereClause(filters);
    const result = await this.model.aggregate({
      _sum: { amount: true },
      where,
    });
    return result._sum.amount;
  }

  async sumAddedCoins(tripId: string): Promise<number | null> {
    const result = await this.model.aggregate({
      _sum: { amount: true },
      where: {
        amount: { gt: 0 },
        group: { tripId },
      },
    });
    return result._sum.amount;
  }

  async sumRemovedCoins(tripId: string): Promise<number | null> {
    const result = await this.model.aggregate({
      _sum: { amount: true },
      where: {
        amount: { lt: 0 },
        group: { tripId },
      },
    });
    return result._sum.amount;
  }

  async getMostActiveAdmin(tripId: string): Promise<MostActiveAdminStat[]> {
    return this.model.groupBy({
      by: ["adminId"],
      _sum: { amount: true },
      _count: { id: true },
      where: { group: { tripId } },
      take: 1,
      orderBy: { _sum: { amount: "desc" } },
    }) as Promise<MostActiveAdminStat[]>;
  }

  async findMany(
    filters: Partial<CoinTransactionFilters>,
    pagination: PaginationOptions,
  ): Promise<CoinTransaction[]> {
    const where = this.buildWhereClause(filters);

    const results = await this.model.findMany({
      where,
      select: {
        id: true,
        amount: true,
        reason: true,
        createdAt: true,
        group: {
          select: {
            id: true,
            name: true,
            coins: true,
          },
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: pagination.limit,
      skip: pagination.offset,
    });

    return results.map((r) =>
      CoinTransactionMapper.toDomain(
        r as PrismaCoinTransaction & {
          group: { id: string; name: string; coins: number };
          admin: {
            id: string;
            firstName: string | null;
            lastName: string | null;
          };
        },
      ),
    );
  }

  async findRecent(
    filters: Partial<CoinTransactionFilters>,
    limit: number,
  ): Promise<CoinTransaction[]> {
    const where = this.buildWhereClause(filters);

    const results = await this.model.findMany({
      where,
      select: {
        id: true,
        amount: true,
        reason: true,
        createdAt: true,
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return results.map((r) => ({
      id: r.id,
      groupId: "", // Not needed for recent transactions view
      amount: r.amount,
      reason: r.reason,
      adminId: "",
      createdAt: r.createdAt,
    }));
  }

  async getTotalCoinsByGroup(
    tripId: string,
  ): Promise<Array<{ groupId: string; _sum: { amount: number | null } }>> {
    return this.model.groupBy({
      by: ["groupId"],
      _sum: { amount: true },
      where: { group: { tripId } },
      orderBy: { _sum: { amount: "desc" } },
    });
  }

  async groupByAdmin(
    tripId: string,
    limit: number,
  ): Promise<Array<{ adminId: string; _count: { id: number } }>> {
    return this.model.groupBy({
      by: ["adminId"],
      _count: { id: true },
      where: { group: { tripId } },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    });
  }

  // ============================================================================
  // Transaction Creation with Business Logic
  // ============================================================================

  async create(data: {
    groupId: string;
    amount: number;
    reason?: string;
    adminId: string;
  }): Promise<CoinTransaction> {
    const result = await this.model.create({
      data: {
        groupId: data.groupId,
        amount: data.amount,
        reason: data.reason,
        adminId: data.adminId,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            coins: true,
          },
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return CoinTransactionMapper.toDomain(
      result as PrismaCoinTransaction & {
        group: { id: string; name: string; coins: number };
        admin: {
          id: string;
          firstName: string | null;
          lastName: string | null;
        };
      },
    );
  }

  // ============================================================================
  // Group Coin Operations (Business Logic)
  // ============================================================================

  async incrementGroupCoins(groupId: string, amount: number): Promise<void> {
    // Access the prisma client through model's context or use a separate query
    // Since we need to update Group, not CoinTransaction, this stays custom
    const prisma = (this.model as unknown as { _client: PrismaClient })._client;
    await prisma.group.update({
      where: { id: groupId },
      data: { coins: { increment: amount } },
    });
  }

  async decrementGroupCoins(
    groupId: string,
    amount: number,
  ): Promise<{ success: boolean; currentBalance?: number }> {
    const prisma = (this.model as unknown as { _client: PrismaClient })._client;
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { coins: true },
    });

    const currentBalance = group?.coins ?? 0;

    if (currentBalance < amount) {
      return { success: false, currentBalance };
    }

    await prisma.group.update({
      where: { id: groupId },
      data: { coins: { decrement: amount } },
    });

    return { success: true, currentBalance: currentBalance - amount };
  }

  async getGroupCoins(groupId: string): Promise<number> {
    const prisma = (this.model as unknown as { _client: PrismaClient })._client;
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { coins: true },
    });
    return group?.coins ?? 0;
  }

  async verifyGroupInTrip(
    groupId: string,
    tripId: string,
  ): Promise<{
    exists: boolean;
    tripId?: string;
    isDeleted?: boolean;
    coins?: number;
  }> {
    const prisma = (this.model as unknown as { _client: PrismaClient })._client;
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { tripId: true, isDeleted: true, coins: true },
    });

    if (!group) {
      return { exists: false };
    }

    return {
      exists: true,
      tripId: group.tripId,
      isDeleted: group.isDeleted,
      coins: group.coins,
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private buildWhereClause(
    filters?: Partial<CoinTransactionFilters>,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (filters?.tripId) {
      where.group = { tripId: filters.tripId };
    }

    if (filters?.groupId) {
      where.groupId = filters.groupId;
    }

    return where;
  }
}
