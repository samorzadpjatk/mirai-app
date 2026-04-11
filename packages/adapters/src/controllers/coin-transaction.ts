import { z } from "zod";
import {
  getUseCaseErrorMessage,
  type GetCoinStatisticsUseCase,
  type GetMostActiveAdminStatsUseCase,
  type GetCoinTransactionsUseCase,
  type GetCoinQuickStatsUseCase,
  type GetCoinAdditionalInsightsUseCase,
  type GetCoinAdditionalInsightsOutput,
} from "@mirai-app/use-cases";

/**
 * Input validation schemas for coin transaction controller
 */
const schemas = {
  getStatistics: z.object({
    tripId: z.string().uuid(),
  }),

  getMostActiveAdminStats: z.object({
    tripId: z.string().uuid(),
  }),

  getAll: z.object({
    tripId: z.string().uuid(),
    pagination: z
      .object({
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
      .optional(),
  }),

  getQuickStats: z.object({
    tripId: z.string().uuid(),
  }),

  getAdditionalInsights: z.object({
    tripId: z.string().uuid(),
  }),

  getCoinTransactions: z.object({
    tripId: z.string().uuid(),
    groupId: z.string().uuid().optional(),
    limit: z.number().min(1).max(100).default(50),
  }),
};

/**
 * CoinTransactionController
 *
 * Handles coin transaction queries and statistics.
 * Delegates to use cases for business logic.
 */
export class CoinTransactionController {
  constructor(
    private getStatisticsUseCase: GetCoinStatisticsUseCase,
    private getMostActiveAdminStatsUseCase: GetMostActiveAdminStatsUseCase,
    private getTransactionsUseCase: GetCoinTransactionsUseCase,
    private getQuickStatsUseCase: GetCoinQuickStatsUseCase,
    private getAdditionalInsightsUseCase: GetCoinAdditionalInsightsUseCase,
  ) {}

  get schemas() {
    return schemas;
  }

  /**
   * Get coin statistics for a trip
   */
  async getStatistics(input: { tripId: string }): Promise<
    | {
        success: true;
        data: {
          transactionCount: number;
          addedCoins: number;
          removedCoins: number;
          netBalance: number;
          time: Date;
        };
      }
    | { success: false; error: string }
  > {
    const result = await this.getStatisticsUseCase.execute({
      tripId: input.tripId,
    });

    if (result.kind === "err") {
      return {
        success: false,
        error: getUseCaseErrorMessage(result.error),
      };
    }

    return { success: true, data: result.value };
  }

  /**
   * Get most active admin statistics
   */
  async getMostActiveAdminStats(input: { tripId: string }): Promise<
    | {
        success: true;
        data: {
          adminId: string;
          totalAmount: number;
          transactionCount: number;
        } | null;
      }
    | { success: false; error: string }
  > {
    const result = await this.getMostActiveAdminStatsUseCase.execute({
      tripId: input.tripId,
    });

    if (result.kind === "err") {
      return {
        success: false,
        error: getUseCaseErrorMessage(result.error),
      };
    }

    return { success: true, data: result.value };
  }

  /**
   * Get all coin transactions with pagination
   */
  async getAll(input: {
    tripId: string;
    pagination?: { limit?: number; offset?: number };
  }): Promise<
    | {
        success: true;
        data: {
          transactions: Array<{
            id: string;
            amount: number;
            reason: string | null;
            createdAt: Date;
            group: { id: string; name: string } | null;
            admin: {
              id: string;
              firstName: string | null;
              lastName: string | null;
            } | null;
          }>;
          pagination: {
            total: number;
            limit: number;
            offset: number;
            hasMore: boolean;
          };
        };
      }
    | { success: false; error: string }
  > {
    const result = await this.getTransactionsUseCase.execute({
      tripId: input.tripId,
      pagination: input.pagination,
    });

    if (result.kind === "err") {
      return {
        success: false,
        error: getUseCaseErrorMessage(result.error),
      };
    }

    return {
      success: true,
      data: {
        transactions: result.value.transactions.map((t) => ({
          id: t.id,
          amount: t.amount,
          reason: t.reason ?? null,
          createdAt: t.createdAt,
          group: t.group ? { id: t.group.id, name: t.group.name } : null,
          admin: t.admin
            ? {
                id: t.admin.id,
                firstName: t.admin.firstName ?? null,
                lastName: t.admin.lastName ?? null,
              }
            : null,
        })),
        pagination: result.value.pagination,
      },
    };
  }

  /**
   * Get quick stats for a trip
   */
  async getQuickStats(input: { tripId: string }): Promise<
    | {
        success: true;
        data: {
          totalCoins: number;
          totalGroups: number;
          averageCoinsPerGroup: number;
          richestGroupId?: string;
          richestGroupName?: string;
          time: Date;
        } | null;
      }
    | { success: false; error: string }
  > {
    const result = await this.getQuickStatsUseCase.execute({
      tripId: input.tripId,
    });

    if (result.kind === "err") {
      return {
        success: false,
        error: getUseCaseErrorMessage(result.error),
      };
    }

    return { success: true, data: result.value };
  }

  /**
   * Get additional insights
   */
  async getAdditionalInsights(input: { tripId: string }): Promise<
    | {
        success: true;
        data: GetCoinAdditionalInsightsOutput | null;
      }
    | { success: false; error: string }
  > {
    const result = await this.getAdditionalInsightsUseCase.execute({
      tripId: input.tripId,
    });

    if (result.kind === "err") {
      return {
        success: false,
        error: getUseCaseErrorMessage(result.error),
      };
    }

    if (!result.value) {
      return { success: true, data: null };
    }

    // Normalize optional nested objects for API serialization
    // Convert undefined to null for consistent API responses
    const normalizedData: GetCoinAdditionalInsightsOutput = {
      mostActiveAdmin: result.value.mostActiveAdmin,
      recentTransactions: result.value.recentTransactions.map((t) => ({
        id: t.id,
        groupId: t.groupId,
        adminId: t.adminId,
        amount: t.amount,
        reason: t.reason ?? null,
        createdAt: t.createdAt,
        group: t.group
          ? {
              id: t.group.id,
              name: t.group.name,
              coins: t.group.coins,
            }
          : null,
        admin: t.admin
          ? {
              id: t.admin.id,
              firstName: t.admin.firstName ?? null,
              lastName: t.admin.lastName ?? null,
            }
          : null,
      })),
    };

    return { success: true, data: normalizedData };
  }

  /**
   * Get coin transactions for a user (with participant validation)
   */
  async getCoinTransactions(input: {
    tripId: string;
    groupId?: string;
    limit: number;
    isParticipant: boolean;
  }): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          amount: number;
          reason: string | null;
          createdAt: Date;
          group: { id: string; name: string; coins: number } | null;
          admin: {
            id: string;
            firstName: string | null;
            lastName: string | null;
          } | null;
        }>;
      }
    | { success: false; error: string }
  > {
    if (!input.isParticipant) {
      return {
        success: false,
        error: "You are not a participant of this trip",
      };
    }

    const result = await this.getTransactionsUseCase.execute({
      tripId: input.tripId,
      groupId: input.groupId,
      pagination: { limit: input.limit, offset: 0 },
    });

    if (result.kind === "err") {
      return {
        success: false,
        error: getUseCaseErrorMessage(result.error),
      };
    }

    return {
      success: true,
      data: result.value.transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        reason: t.reason ?? null,
        createdAt: t.createdAt,
        group: t.group
          ? { id: t.group.id, name: t.group.name, coins: t.group.coins }
          : null,
        admin: t.admin
          ? {
              id: t.admin.id,
              firstName: t.admin.firstName ?? null,
              lastName: t.admin.lastName ?? null,
            }
          : null,
      })),
    };
  }
}
