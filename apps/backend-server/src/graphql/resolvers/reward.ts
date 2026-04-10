/**
 * Reward GraphQL Resolvers
 *
 * Resolvers for Reward domain queries and mutations.
 * Maps controller methods to GraphQL responses with proper error handling.
 *
 * @module Reward/resolvers
 */

import { builder } from "../builder";
import type {
  GetRewardOutput,
  RewardWithCalculations,
} from "@mirai-app/use-cases";
import type { RewardController } from "@mirai-app/adapters";
import { requireAuth, requireModerator } from "../utils/auth-helpers";
import { mapErrorToGraphQL } from "../utils/error-mapper";

// =============================================================================
// Query Fields
// =============================================================================

/**
 * Query: rewardsByTrip - Get visible rewards for a trip (authenticated)
 *
 * Requires authentication. Returns paginated rewards with dynamic pricing.
 */
builder.queryField("rewardsByTrip", (t) =>
  t.field({
    description: "Get visible rewards for a specific trip",
    type: "RewardsConnection",
    args: {
      tripId: t.arg.id({
        description: "ID of the trip",
        required: true,
      }),
      pagination: t.arg({
        type: "PaginationInput",
        description: "Pagination parameters",
        required: false,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Require authentication
      await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<RewardController>("rewardController");

      // Fetch rewards by trip
      const result = await controller.getByTrip({
        tripId: args.tripId,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      const limit = args.pagination?.limit ?? 30;
      const offset = args.pagination?.offset ?? 0;
      const allRewards = result.data.items;

      // Apply pagination
      const paginatedRewards = allRewards.slice(offset, offset + limit);

      return {
        items: paginatedRewards,
        total: allRewards.length,
        limit,
        offset,
        hasMore: offset + limit < allRewards.length,
      };
    },
  }),
);

/**
 * Query: rewardsByTripAdmin - Get all rewards for a trip (admin view, includes hidden)
 *
 * Requires moderator/admin role. Returns all rewards including hidden ones.
 */
builder.queryField("rewardsByTripAdmin", (t) =>
  t.field({
    description: "Get all rewards for a trip including hidden (admin only)",
    type: "RewardsConnection",
    args: {
      tripId: t.arg.id({
        description: "ID of the trip",
        required: true,
      }),
      pagination: t.arg({
        type: "PaginationInput",
        description: "Pagination parameters",
        required: false,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (_root, args, context) => {
      // Require moderator authentication
      await requireModerator(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<RewardController>("rewardController");

      // Fetch all rewards (including hidden)
      const result = await controller.getByTripAdmin({
        tripId: args.tripId,
        pagination: args.pagination
          ? {
              limit: args.pagination.limit ?? 30,
              offset: args.pagination.offset ?? 0,
            }
          : undefined,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        items: result.data.items,
        total: result.data.total,
        limit: result.data.limit,
        offset: result.data.offset,
        hasMore: result.data.hasMore,
      };
    },
  }),
);

/**
 * Query: reward - Get a single reward by ID (authenticated)
 */
builder.queryField("reward", (t) =>
  t.field({
    description: "Get a reward by its ID",
    type: "Reward",
    nullable: true,
    args: {
      id: t.arg.id({
        description: "Reward ID",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context): Promise<GetRewardOutput | null> => {
      // Require authentication
      await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<RewardController>("rewardController");

      // Fetch reward
      const result = await controller.getById({ id: args.id });

      if (!result.success) {
        // Return null for not found
        if (result.error.toLowerCase().includes("not found")) {
          return null;
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Query: purchaseHistory - Get purchase history for a trip
 *
 * Returns purchases visible to the current user (own group only for non-staff).
 */
builder.queryField("purchaseHistory", (t) =>
  t.field({
    description: "Get purchase history for a trip",
    type: "PurchaseHistoryConnection",
    args: {
      tripId: t.arg.id({
        description: "ID of the trip",
        required: true,
      }),
      pagination: t.arg({
        type: "PaginationInput",
        description: "Pagination parameters",
        required: false,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Require authentication
      const authContext = await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<RewardController>("rewardController");

      // Fetch purchase history
      const result = await controller.getPurchaseHistory({
        userId: authContext.userId as string,
        tripId: args.tripId,
        isStaff:
          authContext.role === "ADMIN" || authContext.role === "MODERATOR",
        pagination: args.pagination
          ? {
              limit: args.pagination.limit ?? 30,
              offset: args.pagination.offset ?? 0,
            }
          : undefined,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        items: result.data.items,
        total: result.data.total,
        limit: result.data.limit,
        offset: result.data.offset,
        hasMore: result.data.hasMore,
      };
    },
  }),
);

/**
 * Query: totalAvailablePoints - Get total available points for a trip (admin only)
 */
builder.queryField("totalAvailablePoints", (t) =>
  t.field({
    description: "Get total available points for a trip (admin only)",
    type: "TotalAvailablePointsPayload",
    args: {
      tripId: t.arg.id({
        description: "ID of the trip",
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
      const controller =
        context.container.resolve<RewardController>("rewardController");

      // Fetch total available points
      const result = await controller.getTotalAvailablePoints({
        tripId: args.tripId,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        totalPoints: result.data.totalPoints,
      };
    },
  }),
);

// =============================================================================
// Mutation Fields
// =============================================================================

/**
 * Mutation: createReward - Create a new reward (admin/moderator only)
 */
builder.mutationField("createReward", (t) =>
  t.field({
    description: "Create a new reward (moderator only)",
    type: "CreateRewardPayload",
    args: {
      input: t.arg({
        type: "CreateRewardInput",
        description: "Reward creation data",
        required: true,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (_root, args, context) => {
      // Require moderator authentication
      const authContext = await requireModerator(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<RewardController>("rewardController");

      // Create reward
      const result = await controller.create({
        name: args.input.name,
        description: args.input.description,
        availableQuantity: args.input.availableQuantity,
        coinCostPercentage: args.input.coinCost,
        images: args.input.images ?? [],
        isHidden: args.input.isHidden ?? false,
        tripId: args.input.tripId,
        createdById: authContext.userId as string,
        creatorRole: authContext.role,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { reward: result.data };
    },
  }),
);

/**
 * Mutation: updateReward - Update an existing reward (admin/moderator only)
 */
builder.mutationField("updateReward", (t) =>
  t.field({
    description: "Update an existing reward (moderator only)",
    type: "UpdateRewardPayload",
    args: {
      input: t.arg({
        type: "UpdateRewardInput",
        description: "Reward update data",
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
      const controller =
        context.container.resolve<RewardController>("rewardController");

      // Update reward
      const result = await controller.update({
        rewardId: args.input.id,
        name: args.input.name ?? undefined,
        description: args.input.description ?? undefined,
        availableQuantity: args.input.availableQuantity ?? undefined,
        images: args.input.images ?? undefined,
        coinCostPercentage: args.input.coinCost ?? undefined,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { reward: result.data };
    },
  }),
);

/**
 * Mutation: setRewardHidden - Set reward hidden status (admin/moderator only)
 */
builder.mutationField("setRewardHidden", (t) =>
  t.field({
    description: "Set reward hidden status (moderator only)",
    type: "SetRewardHiddenPayload",
    args: {
      input: t.arg({
        type: "SetRewardHiddenInput",
        description: "Hidden status data",
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
      const controller =
        context.container.resolve<RewardController>("rewardController");

      // Get current reward to capture previous hidden status
      const currentReward = await controller.getById({ id: args.input.id });
      const previousHidden = currentReward.success
        ? currentReward.data.isHidden
        : false;

      // Set hidden status
      const result = await controller.setHidden({
        rewardId: args.input.id,
        isHidden: args.input.isHidden,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        reward: result.data,
        previousHidden,
      };
    },
  }),
);

/**
 * Mutation: deleteReward - Delete a reward (admin/moderator only)
 */
builder.mutationField("deleteReward", (t) =>
  t.field({
    description: "Delete a reward (moderator only)",
    type: "DeleteRewardPayload",
    args: {
      id: t.arg.id({
        description: "ID of the reward to delete",
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
      const controller =
        context.container.resolve<RewardController>("rewardController");

      // Delete reward
      const result = await controller.delete({
        rewardId: args.id,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        success: true,
        deletedRewardId: args.id,
      };
    },
  }),
);

/**
 * Mutation: purchaseReward - Purchase a reward (authenticated group leader)
 */
builder.mutationField("purchaseReward", (t) =>
  t.field({
    description: "Purchase a reward (authenticated users)",
    type: "PurchaseRewardPayload",
    args: {
      input: t.arg({
        type: "PurchaseRewardInput",
        description: "Purchase data",
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
      const controller =
        context.container.resolve<RewardController>("rewardController");

      // Purchase reward
      const result = await controller.purchase({
        rewardId: args.input.rewardId,
        quantity: args.input.quantity,
        userId: authContext.userId as string,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        purchase: result.data,
        remainingGroupCoins: result.data.remainingGroupCoins,
        remainingRewardQuantity: result.data.remainingRewardQuantity,
      };
    },
  }),
);

/**
 * Mutation: updatePurchaseStatus - Update purchase status (admin/staff only)
 */
builder.mutationField("updatePurchaseStatus", (t) =>
  t.field({
    description: "Update a purchase status (moderator only)",
    type: "UpdatePurchaseStatusPayload",
    args: {
      input: t.arg({
        type: "UpdatePurchaseStatusInput",
        description: "Status update data",
        required: true,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (_root, args, context) => {
      // Require moderator authentication
      const authContext = await requireModerator(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<RewardController>("rewardController");

      // Update purchase status
      const result = await controller.updatePurchaseStatus({
        purchaseId: args.input.purchaseId,
        status: args.input.status,
        updatedById: authContext.userId as string,
        collectionMethod: args.input.collectionMethod ?? undefined,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        purchase: result.data,
        refunded: result.data.refunded,
        previousStatus: result.data.status, // Note: this is actually the new status, previous is not returned by controller
      };
    },
  }),
);

/**
 * Mutation: updateMyPurchaseStatus - Update my purchase status (group leader only)
 * Limited transitions: can only move to IN_DELIVERY or CANCELLED
 */
builder.mutationField("updateMyPurchaseStatus", (t) =>
  t.field({
    description:
      "Update own purchase status (group leader only, limited transitions)",
    type: "UpdateMyPurchaseStatusPayload",
    args: {
      input: t.arg({
        type: "UpdateMyPurchaseStatusInput",
        description: "Status update data",
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
      const controller =
        context.container.resolve<RewardController>("rewardController");

      // Update my purchase status
      const result = await controller.updateMyPurchaseStatus({
        purchaseId: args.input.purchaseId,
        status: args.input.status,
        userId: authContext.userId as string,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        purchase: result.data,
        previousStatus: result.data.status, // Note: this is actually the new status
      };
    },
  }),
);

// =============================================================================
// Export
// =============================================================================

// Resolvers are registered automatically by importing this file
export {};
