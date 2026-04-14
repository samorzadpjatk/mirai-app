import { z } from "zod";
import { Effect, type Layer } from "effect";
import {
  getCoinStatisticsUseCase,
  getMostActiveAdminStatsUseCase,
  getCoinTransactionsUseCase,
  getCoinQuickStatsUseCase,
  getCoinAdditionalInsightsUseCase,
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
 * Helper to run an Effect with the provided Layer and convert to controller result
 */
async function runWithLayer<T>(
  effect: Effect.Effect<T, unknown, unknown>,
  layer: Layer.Layer<unknown>,
  transform?: (value: T) => unknown,
): Promise<
  { success: true; data: unknown } | { success: false; error: string }
> {
  const provided = effect.pipe(Effect.provide(layer));
  const result = await Effect.runPromise(Effect.either(provided));

  if (result._tag === "Left") {
    const error = result.left;
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }

  return {
    success: true,
    data: transform ? transform(result.right) : result.right,
  };
}

/**
 * CoinTransactionController
 *
 * Handles coin transaction queries and statistics.
 * Delegates to use cases for business logic.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class CoinTransactionController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

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
    const effect = getCoinStatisticsUseCase({
      tripId: input.tripId,
    });

    return (await runWithLayer(effect, this.appLayer)) as Promise<
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
    >;
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
    const effect = getMostActiveAdminStatsUseCase({
      tripId: input.tripId,
    });

    return (await runWithLayer(effect, this.appLayer)) as Promise<
      | {
          success: true;
          data: {
            adminId: string;
            totalAmount: number;
            transactionCount: number;
          } | null;
        }
      | { success: false; error: string }
    >;
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
    const effect = getCoinTransactionsUseCase({
      tripId: input.tripId,
      pagination: input.pagination,
    });

    const result = await runWithLayer(effect, this.appLayer);

    if (!result.success) {
      return result as { success: false; error: string };
    }

    const data = result.data as {
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

    return {
      success: true,
      data: {
        transactions: data.transactions.map((t) => ({
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
        pagination: data.pagination,
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
    const effect = getCoinQuickStatsUseCase({
      tripId: input.tripId,
    });

    return (await runWithLayer(effect, this.appLayer)) as Promise<
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
    >;
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
    const effect = getCoinAdditionalInsightsUseCase({
      tripId: input.tripId,
    });

    const result = await runWithLayer(effect, this.appLayer);

    if (!result.success) {
      return result as { success: false; error: string };
    }

    if (!result.data) {
      return { success: true, data: null };
    }

    const resultData = result.data as GetCoinAdditionalInsightsOutput;
    const normalizedData: GetCoinAdditionalInsightsOutput = {
      mostActiveAdmin: resultData.mostActiveAdmin,
      recentTransactions: resultData.recentTransactions.map((t) => ({
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

    const effect = getCoinTransactionsUseCase({
      tripId: input.tripId,
      groupId: input.groupId,
      pagination: { limit: input.limit, offset: 0 },
    });

    const result = await runWithLayer(effect, this.appLayer);

    if (!result.success) {
      return result as { success: false; error: string };
    }

    const data = result.data as {
      transactions: Array<{
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
    };

    return {
      success: true,
      data: data.transactions.map((t) => ({
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
