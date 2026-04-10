/**
 * Coin Transaction GraphQL Types
 *
 * Pothos type definitions for the Coin Transaction domain.
 * Maps from CoinTransaction DTOs to GraphQL schema types.
 *
 * @module coinTransaction/types
 */

import { builder } from "../builder";
import type {
  GetCoinStatisticsOutput,
  GetCoinQuickStatsOutput,
  GetMostActiveAdminStatsOutput,
  GetCoinAdditionalInsightsOutput,
  GetCoinTransactionsOutput,
} from "@mirai-app/use-cases";
import type { CoinTransaction } from "@mirai-app/use-cases";

// =============================================================================
// Coin Transaction Object Type
// =============================================================================

/**
 * CoinTransaction type for GraphQL schema
 *
 * Represents a single coin transaction (addition or removal of coins from a group).
 */
export const CoinTransactionType = builder.objectType("CoinTransaction", {
  description:
    "A coin transaction recording the addition or removal of coins from a group",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "Unique identifier for the transaction",
      nullable: false,
    }),

    groupId: t.exposeID("groupId", {
      description: "ID of the group affected by this transaction",
      nullable: false,
    }),

    amount: t.exposeInt("amount", {
      description: "Amount of coins added (positive) or removed (negative)",
      nullable: false,
    }),

    reason: t.exposeString("reason", {
      description: "Reason or note for this transaction",
      nullable: true,
    }),

    adminId: t.exposeID("adminId", {
      description: "ID of the admin who performed this transaction",
      nullable: false,
    }),

    createdAt: t.field({
      type: "DateTime",
      description: "When the transaction was created",
      nullable: false,
      resolve: (transaction) => transaction.createdAt,
    }),

    group: t.field({
      type: CoinTransactionGroupType,
      description: "Group information for this transaction",
      nullable: true,
      resolve: (transaction) => transaction.group,
    }),

    admin: t.field({
      type: CoinTransactionAdminType,
      description: "Admin information for this transaction",
      nullable: true,
      resolve: (transaction) => transaction.admin,
    }),
  }),
});

/**
 * Group information within a coin transaction
 */
export const CoinTransactionGroupType = builder.objectType(
  "CoinTransactionGroup",
  {
    description: "Group information in a coin transaction context",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      id: t.exposeID("id", {
        description: "Group ID",
        nullable: false,
      }),

      name: t.exposeString("name", {
        description: "Group name",
        nullable: false,
      }),

      coins: t.exposeInt("coins", {
        description: "Current coin balance of the group",
        nullable: false,
      }),
    }),
  },
);

/**
 * Admin information within a coin transaction
 */
export const CoinTransactionAdminType = builder.objectType(
  "CoinTransactionAdmin",
  {
    description: "Admin information in a coin transaction context",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      id: t.exposeID("id", {
        description: "Admin user ID",
        nullable: false,
      }),

      firstName: t.exposeString("firstName", {
        description: "Admin's first name",
        nullable: true,
      }),

      lastName: t.exposeString("lastName", {
        description: "Admin's last name",
        nullable: true,
      }),

      fullName: t.string({
        description: "Admin's full name (computed)",
        nullable: false,
        resolve: (admin) => {
          const fullName = [admin.firstName, admin.lastName]
            .filter(Boolean)
            .join(" ")
            .trim();
          return fullName || "Unknown admin";
        },
      }),
    }),
  },
);

// =============================================================================
// Statistics Types
// =============================================================================

/**
 * Coin statistics for a trip
 */
export const CoinStatisticsType = builder.objectType("CoinStatistics", {
  description: "Comprehensive coin statistics for a trip",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    transactionCount: t.exposeInt("transactionCount", {
      description: "Total number of coin transactions",
      nullable: false,
    }),

    addedCoins: t.exposeInt("addedCoins", {
      description: "Total coins added to groups (positive amounts)",
      nullable: false,
    }),

    removedCoins: t.exposeInt("removedCoins", {
      description:
        "Total coins removed from groups (negative amounts, as positive number)",
      nullable: false,
    }),

    netBalance: t.exposeInt("netBalance", {
      description: "Net balance of all transactions (added - removed)",
      nullable: false,
    }),

    time: t.field({
      type: "DateTime",
      description: "When the statistics were computed",
      nullable: false,
      resolve: (stats) => stats.time,
    }),
  }),
});

/**
 * Quick stats for a trip
 */
export const CoinQuickStatsType = builder.objectType("CoinQuickStats", {
  description: "Quick overview statistics for coin distribution in a trip",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    totalCoins: t.exposeInt("totalCoins", {
      description: "Total coins across all groups",
      nullable: false,
    }),

    totalGroups: t.exposeInt("totalGroups", {
      description: "Total number of groups with transactions",
      nullable: false,
    }),

    averageCoinsPerGroup: t.exposeInt("averageCoinsPerGroup", {
      description: "Average coins per group",
      nullable: false,
    }),

    richestGroupId: t.exposeID("richestGroupId", {
      description: "ID of the group with the most coins",
      nullable: true,
    }),

    richestGroupName: t.exposeString("richestGroupName", {
      description: "Name of the group with the most coins",
      nullable: true,
    }),

    time: t.field({
      type: "DateTime",
      description: "When the statistics were computed",
      nullable: false,
      resolve: (stats) => stats.time,
    }),
  }),
});

/**
 * Most active admin stats
 */
export const MostActiveAdminStatsType = builder.objectType(
  "MostActiveAdminStats",
  {
    description: "Statistics about the most active admin by transaction volume",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      adminId: t.exposeID("adminId", {
        description: "ID of the most active admin",
        nullable: false,
      }),

      totalAmount: t.exposeInt("totalAmount", {
        description: "Total amount of coins this admin has processed",
        nullable: false,
      }),

      transactionCount: t.exposeInt("transactionCount", {
        description: "Number of transactions performed by this admin",
        nullable: false,
      }),

      adminName: t.string({
        description: "Full name of the admin (resolved separately)",
        nullable: true,
        resolve: (stats) => {
          // This is a placeholder - the actual name is resolved in the resolver
          // by fetching user data separately
          return null;
        },
      }),
    }),
  },
);

/**
 * Formatted user info (for most active admin display)
 */
export const FormattedUserType = builder.objectType("FormattedUser", {
  description: "User information formatted for display",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    name: t.exposeString("name", {
      description: "User's full name",
      nullable: false,
    }),

    transactionCount: t.exposeInt("transactionCount", {
      description: "Number of transactions by this user",
      nullable: false,
    }),
  }),
});

/**
 * Additional insights for coin transactions
 */
export const CoinAdditionalInsightsType = builder.objectType(
  "CoinAdditionalInsights",
  {
    description: "Additional insights about coin transactions",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      mostActiveAdmin: t.field({
        type: FormattedUserType,
        description: "Information about the most active admin",
        nullable: true,
        resolve: (insights) => insights.mostActiveAdmin,
      }),

      recentTransactions: t.field({
        type: [CoinTransactionType],
        description: "Recent coin transactions",
        nullable: false,
        resolve: (insights) => insights.recentTransactions,
      }),
    }),
  },
);

// =============================================================================
// Pagination Types
// =============================================================================

/**
 * Pagination metadata
 */
export const CoinTransactionPaginationType = builder.objectType(
  "CoinTransactionPagination",
  {
    description: "Pagination metadata for coin transaction lists",
    fields: (t) => ({
      total: t.exposeInt("total", {
        description: "Total number of transactions available",
        nullable: false,
      }),

      limit: t.exposeInt("limit", {
        description: "Number of items per page",
        nullable: false,
      }),

      offset: t.exposeInt("offset", {
        description: "Number of items skipped",
        nullable: false,
      }),

      hasMore: t.exposeBoolean("hasMore", {
        description: "Whether more items are available",
        nullable: false,
      }),
    }),
  },
);

/**
 * Paginated coin transaction result
 */
export const CoinTransactionsConnectionType = builder.objectType(
  "CoinTransactionsConnection",
  {
    description: "A paginated list of coin transactions with metadata",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      transactions: t.field({
        type: [CoinTransactionType],
        description: "The transactions in this page",
        nullable: false,
        resolve: (conn) =>
          (conn as { transactions: CoinTransaction[] }).transactions,
      }),

      pagination: t.field({
        type: CoinTransactionPaginationType,
        description: "Pagination metadata",
        nullable: false,
        resolve: (conn) =>
          (conn as { pagination: GetCoinTransactionsOutput["pagination"] })
            .pagination,
      }),
    }),
  },
);

// =============================================================================
// Input Types
// =============================================================================

/**
 * Pagination input
 */
export const CoinTransactionPaginationInput = builder.inputType(
  "CoinTransactionPaginationInput",
  {
    description: "Pagination parameters for coin transaction queries",
    fields: (t) => ({
      limit: t.int({
        description: "Maximum number of items to return (1-100)",
        required: false,
        defaultValue: 50,
      }),

      offset: t.int({
        description: "Number of items to skip",
        required: false,
        defaultValue: 0,
      }),
    }),
  },
);

/**
 * Input for coin statistics query
 */
export const GetCoinStatisticsInput = builder.inputType(
  "GetCoinStatisticsInput",
  {
    description: "Input for fetching coin statistics",
    fields: (t) => ({
      tripId: t.id({
        description: "Trip ID to fetch statistics for",
        required: true,
      }),
    }),
  },
);

/**
 * Input for most active admin stats query
 */
export const GetMostActiveAdminStatsInput = builder.inputType(
  "GetMostActiveAdminStatsInput",
  {
    description: "Input for fetching most active admin statistics",
    fields: (t) => ({
      tripId: t.id({
        description: "Trip ID to fetch statistics for",
        required: true,
      }),
    }),
  },
);

/**
 * Input for coin transactions query (moderator view)
 */
export const GetAllCoinTransactionsInput = builder.inputType(
  "GetAllCoinTransactionsInput",
  {
    description: "Input for fetching all coin transactions (moderator view)",
    fields: (t) => ({
      tripId: t.id({
        description: "Trip ID to fetch transactions for",
        required: true,
      }),

      pagination: t.field({
        type: CoinTransactionPaginationInput,
        description: "Pagination parameters",
        required: false,
      }),
    }),
  },
);

/**
 * Input for quick stats query
 */
export const GetCoinQuickStatsInput = builder.inputType(
  "GetCoinQuickStatsInput",
  {
    description: "Input for fetching quick coin statistics",
    fields: (t) => ({
      tripId: t.id({
        description: "Trip ID to fetch statistics for",
        required: true,
      }),
    }),
  },
);

/**
 * Input for additional insights query
 */
export const GetCoinAdditionalInsightsInput = builder.inputType(
  "GetCoinAdditionalInsightsInput",
  {
    description: "Input for fetching additional coin insights",
    fields: (t) => ({
      tripId: t.id({
        description: "Trip ID to fetch insights for",
        required: true,
      }),
    }),
  },
);

/**
 * Input for user's coin transactions query
 */
export const GetUserCoinTransactionsInput = builder.inputType(
  "GetUserCoinTransactionsInput",
  {
    description: "Input for fetching coin transactions visible to a user",
    fields: (t) => ({
      tripId: t.id({
        description: "Trip ID to fetch transactions for",
        required: true,
      }),

      groupId: t.id({
        description: "Optional group ID to filter by",
        required: false,
      }),

      limit: t.int({
        description: "Maximum number of items to return (1-100)",
        required: false,
        defaultValue: 50,
      }),
    }),
  },
);

// =============================================================================
// Export
// =============================================================================

export default CoinTransactionType;
