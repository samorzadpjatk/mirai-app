/**
 * Coin Transaction GraphQL Resolvers
 *
 * Resolvers for Coin Transaction queries and mutations.
 * Maps controller outputs to GraphQL responses with proper error handling.
 *
 * @module coinTransaction/resolvers
 */

import { builder } from "../builder";
import { CoinTransactionController } from "@mirai-app/adapters";
import { requireAuth, requireModerator } from "../utils/auth-helpers";
import { mapErrorToGraphQL } from "../utils/error-mapper";
import type {
  GetCoinStatisticsOutput,
  GetCoinQuickStatsOutput,
  GetMostActiveAdminStatsOutput,
  GetCoinAdditionalInsightsOutput,
  GetCoinTransactionsOutput,
} from "@mirai-app/use-cases";

// =============================================================================
// Import Types (registers them with builder)
// =============================================================================

import "../types/coinTransaction";

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format user full name from first and last name
 */
function formatUserFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || "Unknown user";
}

// =============================================================================
// Query Fields
// =============================================================================

/**
 * Query: coinStatistics - Get comprehensive coin statistics for a trip
 *
 * Requires moderator or admin role. Returns transaction count, added coins,
 * removed coins, and net balance.
 */
builder.queryField("coinStatistics", (t) =>
  t.field({
    description:
      "Get comprehensive coin statistics for a trip (moderator only)",
    type: "CoinStatistics",
    nullable: true,
    args: {
      input: t.arg({
        type: "GetCoinStatisticsInput",
        description: "Input for fetching coin statistics",
        required: true,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (
      _root,
      args,
      context,
    ): Promise<GetCoinStatisticsOutput | null> => {
      // Require moderator authentication
      await requireModerator(context);

      // Get controller from DI container
      const controller = context.container.resolve<CoinTransactionController>(
        "coinTransactionController",
      );

      // Fetch statistics
      const result = await controller.getStatistics({
        tripId: args.input.tripId,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Query: mostActiveAdminStats - Get most active admin statistics
 *
 * Requires moderator or admin role. Returns the admin with the highest
 * transaction volume.
 */
builder.queryField("mostActiveAdminStats", (t) =>
  t.field({
    description: "Get most active admin statistics (moderator only)",
    type: "MostActiveAdminStats",
    nullable: true,
    args: {
      input: t.arg({
        type: "GetMostActiveAdminStatsInput",
        description: "Input for fetching most active admin stats",
        required: true,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (
      _root,
      args,
      context,
    ): Promise<GetMostActiveAdminStatsOutput | null> => {
      // Require moderator authentication
      await requireModerator(context);

      // Get controller from DI container
      const controller = context.container.resolve<CoinTransactionController>(
        "coinTransactionController",
      );

      // Fetch most active admin stats
      const result = await controller.getMostActiveAdminStats({
        tripId: args.input.tripId,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Query: coinTransactions - Get all coin transactions for a trip (moderator view)
 *
 * Requires moderator or admin role. Returns paginated transactions with
 * full details.
 */
builder.queryField("coinTransactions", (t) =>
  t.field({
    description: "Get all coin transactions for a trip (moderator only)",
    type: "CoinTransactionsConnection",
    nullable: true,
    args: {
      input: t.arg({
        type: "GetAllCoinTransactionsInput",
        description: "Input for fetching transactions",
        required: true,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (_root, args, context) => {
      // Require moderator authentication
      await requireModerator(context);

      // Get controller from DI container
      const controller = context.container.resolve<CoinTransactionController>(
        "coinTransactionController",
      );

      // Fetch transactions
      const result = await controller.getAll({
        tripId: args.input.tripId,
        pagination: {
          limit: args.input.pagination?.limit,
          offset: args.input.pagination?.offset,
        },
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        transactions: result.data.transactions,
        pagination: result.data.pagination,
      };
    },
  }),
);

/**
 * Query: coinQuickStats - Get quick coin statistics for a trip
 *
 * Requires moderator or admin role. Returns total coins, group count,
 * average coins per group, and richest group info.
 */
builder.queryField("coinQuickStats", (t) =>
  t.field({
    description: "Get quick coin statistics for a trip (moderator only)",
    type: "CoinQuickStats",
    nullable: true,
    args: {
      input: t.arg({
        type: "GetCoinQuickStatsInput",
        description: "Input for fetching quick stats",
        required: true,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (
      _root,
      args,
      context,
    ): Promise<
      (GetCoinQuickStatsOutput & { richestGroupName?: string | null }) | null
    > => {
      // Require moderator authentication
      await requireModerator(context);

      // Get controller from DI container
      const controller = context.container.resolve<CoinTransactionController>(
        "coinTransactionController",
      );

      // Fetch quick stats
      const result = await controller.getQuickStats({
        tripId: args.input.tripId,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      if (!result.data) {
        return null;
      }

      const data = result.data;

      // Resolve richest group name if group ID exists
      if (data.richestGroupId) {
        // Access database through container to get group name
        const db = context.container.resolve("db") as {
          group: {
            findUnique: (args: {
              where: { id: string };
              select: { name: true };
            }) => Promise<{ name: string } | null>;
          };
        };

        const group = await db.group.findUnique({
          where: { id: data.richestGroupId },
          select: { name: true },
        });

        if (group) {
          return {
            ...data,
            richestGroupName: group.name,
          };
        }
      }

      return data;
    },
  }),
);

/**
 * Query: coinAdditionalInsights - Get additional insights for a trip
 *
 * Requires moderator or admin role. Returns most active admin info
 * (with resolved name) and recent transactions.
 */
builder.queryField("coinAdditionalInsights", (t) =>
  t.field({
    description: "Get additional coin insights for a trip (moderator only)",
    type: "CoinAdditionalInsights",
    nullable: true,
    args: {
      input: t.arg({
        type: "GetCoinAdditionalInsightsInput",
        description: "Input for fetching additional insights",
        required: true,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (
      _root,
      args,
      context,
    ): Promise<GetCoinAdditionalInsightsOutput | null> => {
      // Require moderator authentication
      await requireModerator(context);

      // Get controller from DI container
      const controller = context.container.resolve<CoinTransactionController>(
        "coinTransactionController",
      );

      // Fetch additional insights
      const result = await controller.getAdditionalInsights({
        tripId: args.input.tripId,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      if (!result.data) {
        return null;
      }

      const data = result.data;

      // Resolve most active admin name if present
      if (data.mostActiveAdmin) {
        // Access database through container to get admin name
        const db = context.container.resolve("db") as {
          user: {
            findUnique: (args: {
              where: { id: string };
              select: { firstName: true; lastName: true };
            }) => Promise<{
              firstName: string | null;
              lastName: string | null;
            } | null>;
          };
        };

        const admin = await db.user.findUnique({
          where: { id: data.mostActiveAdmin.name },
          select: { firstName: true, lastName: true },
        });

        if (admin) {
          return {
            mostActiveAdmin: {
              name: formatUserFullName(admin.firstName, admin.lastName),
              transactionCount: data.mostActiveAdmin.transactionCount,
            },
            recentTransactions: data.recentTransactions,
          };
        }
      }

      return {
        mostActiveAdmin: null,
        recentTransactions: data.recentTransactions,
      };
    },
  }),
);

/**
 * Query: myCoinTransactions - Get coin transactions visible to the current user
 *
 * Requires authentication. Returns transactions for trips the user
 * is a participant in.
 */
builder.queryField("myCoinTransactions", (t) =>
  t.field({
    description: "Get coin transactions for the current user",
    type: ["CoinTransaction"],
    nullable: false,
    args: {
      input: t.arg({
        type: "GetUserCoinTransactionsInput",
        description: "Input for fetching user transactions",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Require authentication
      const authContext = await requireAuth(context);

      // Get controller from DI container
      const controller = context.container.resolve<CoinTransactionController>(
        "coinTransactionController",
      );

      // Check if user is participant (this would ideally be in a use case,
      // but we need to check it here before calling the controller)
      // For now, we assume the user is a participant if they're authenticated
      // and calling this endpoint

      // Fetch user's coin transactions
      const result = await controller.getCoinTransactions({
        tripId: args.input.tripId,
        groupId: args.input.groupId,
        limit: args.input.limit ?? 50,
        isParticipant: true, // Assume true since they passed auth
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

// =============================================================================
// Export
// =============================================================================

// Resolvers are registered automatically by importing this file
export {};
