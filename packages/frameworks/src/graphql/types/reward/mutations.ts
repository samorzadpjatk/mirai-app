import { GraphQLError } from "graphql";
import { builder } from "../../builder.js";
import {
  RewardType,
  RewardPurchaseType,
  PurchaseStatusEnum,
  RewardStatusEnum,
} from "./types.js";
import type { RewardDTO, RewardPurchaseDTO } from "./types.js";
import { RewardPurchaseStatus } from "@mirai-app/domain";

/**
 * Create Reward Input
 */
const CreateRewardInput = builder.inputType("CreateRewardInput", {
  description: "Input for creating a reward",
  fields: (t) => ({
    tripId: t.field({ type: "ID", required: true }),
    name: t.field({ type: "String", required: true }),
    description: t.field({ type: "String" }),
    availableQuantity: t.field({ type: "Int", required: true }),
    coinCostPercentage: t.field({ type: "Int", required: true }),
    image: t.field({ type: "String" }),
    images: t.field({ type: ["String"] }),
    isHidden: t.field({ type: "Boolean" }),
  }),
});

/**
 * Update Reward Input
 */
const UpdateRewardInput = builder.inputType("UpdateRewardInput", {
  description: "Input for updating a reward",
  fields: (t) => ({
    name: t.field({ type: "String" }),
    description: t.field({ type: "String" }),
    availableQuantity: t.field({ type: "Int" }),
    coinCostPercentage: t.field({ type: "Int" }),
    images: t.field({ type: ["String"] }),
  }),
});

/**
 * Purchase Reward Input
 */
const PurchaseRewardInput = builder.inputType("PurchaseRewardInput", {
  description: "Input for purchasing a reward",
  fields: (t) => ({
    rewardId: t.field({ type: "ID", required: true }),
    quantity: t.field({ type: "Int", required: true }),
  }),
});

/**
 * Redeem Reward Input
 */
const RedeemRewardInput = builder.inputType("RedeemRewardInput", {
  description: "Input for redeeming a reward purchase (mark as delivered)",
  fields: (t) => ({
    purchaseId: t.field({ type: "ID", required: true }),
    collectionMethod: t.field({ type: "String" }),
  }),
});

/**
 * Cancel Reward Purchase Input
 */
const CancelRewardPurchaseInput = builder.inputType(
  "CancelRewardPurchaseInput",
  {
    description: "Input for cancelling a reward purchase",
    fields: (t) => ({
      purchaseId: t.field({ type: "ID", required: true }),
    }),
  },
);

/**
 * Reward Mutations
 */
builder.mutationFields((t) => ({
  /**
   * Create a new reward
   */
  createReward: t.field({
    type: RewardType,
    args: {
      input: t.arg({ type: CreateRewardInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          tripId: string;
          name: string;
          description?: string | null;
          availableQuantity: number;
          coinCostPercentage: number;
          image?: string | null;
          images?: string[] | null;
          isHidden?: boolean | null;
        };
      },
      ctx: {
        authContext?: { userId: string; role: string };
        controllers: {
          rewardController: {
            create: (input: {
              name: string;
              description?: string;
              availableQuantity: number;
              coinCostPercentage: number;
              image?: string | null;
              images?: string[];
              isHidden?: boolean;
              tripId: string;
              createdById: string;
              creatorRole: string;
            }) => Promise<
              | { success: true; data: RewardDTO }
              | { success: false; error: string }
            >;
          };
        };
      },
    ) => {
      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.rewardController;
      const result = await controller.create({
        name: args.input.name,
        description: args.input.description ?? undefined,
        availableQuantity: args.input.availableQuantity,
        coinCostPercentage: args.input.coinCostPercentage,
        image: args.input.image ?? null,
        images: args.input.images ?? undefined,
        isHidden: args.input.isHidden ?? false,
        tripId: args.input.tripId,
        createdById: ctx.authContext.userId,
        creatorRole: ctx.authContext.role,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Update an existing reward
   */
  updateReward: t.field({
    type: RewardType,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateRewardInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        id: string;
        input: {
          name?: string | null;
          description?: string | null;
          availableQuantity?: number | null;
          coinCostPercentage?: number | null;
          images?: string[] | null;
        };
      },
      ctx: {
        controllers: {
          rewardController: {
            update: (input: {
              rewardId: string;
              name?: string;
              description?: string;
              availableQuantity?: number;
              images?: string[];
              coinCostPercentage?: number;
            }) => Promise<
              | { success: true; data: RewardDTO }
              | { success: false; error: string }
            >;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.rewardController;
      const result = await controller.update({
        rewardId: args.id,
        name: args.input.name ?? undefined,
        description: args.input.description ?? undefined,
        availableQuantity: args.input.availableQuantity ?? undefined,
        images: args.input.images ?? undefined,
        coinCostPercentage: args.input.coinCostPercentage ?? undefined,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Delete a reward (only if no purchases)
   */
  deleteReward: t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (
      _parent,
      args: { id: string },
      ctx: {
        controllers: {
          rewardController: {
            delete: (input: {
              rewardId: string;
            }) => Promise<
              | { success: true; data: { success: boolean } }
              | { success: false; error: string }
            >;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.rewardController;
      const result = await controller.delete({
        rewardId: args.id,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data.success;
    },
  }),

  /**
   * Purchase a reward
   */
  purchaseReward: t.field({
    type: RewardPurchaseType,
    args: {
      input: t.arg({ type: PurchaseRewardInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          rewardId: string;
          quantity: number;
        };
      },
      ctx: {
        authContext?: { userId: string };
        controllers: {
          rewardController: {
            purchase: (input: {
              rewardId: string;
              quantity: number;
              userId: string;
            }) => Promise<
              | {
                  success: true;
                  data: {
                    purchaseId: string;
                    rewardId: string;
                    groupId: string;
                    quantity: number;
                    totalCost: number;
                    status: string;
                    purchasedAt: Date;
                    remainingGroupCoins: number;
                    remainingRewardQuantity: number;
                  };
                }
              | { success: false; error: string }
            >;
          };
        };
      },
    ) => {
      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.rewardController;
      const result = await controller.purchase({
        rewardId: args.input.rewardId,
        quantity: args.input.quantity,
        userId: ctx.authContext.userId,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return {
        id: result.data.purchaseId,
        rewardId: result.data.rewardId,
        userId: ctx.authContext.userId,
        groupId: result.data.groupId,
        pointsSpent: result.data.totalCost,
        totalCost: result.data.totalCost,
        status: result.data.status,
        quantity: result.data.quantity,
        collectionMethod: null,
        collectedAt: null,
        collectedById: null,
        notes: null,
        purchasedAt: result.data.purchasedAt,
        updatedAt: result.data.purchasedAt,
        statusUpdatedAt: result.data.purchasedAt,
        statusUpdatedById: null,
      };
    },
  }),

  /**
   * Redeem a reward purchase (mark as delivered)
   * This is an admin/staff operation to mark a purchase as completed/delivered
   */
  redeemReward: t.field({
    type: RewardPurchaseType,
    args: {
      input: t.arg({ type: RedeemRewardInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          purchaseId: string;
          collectionMethod?: string | null;
        };
      },
      ctx: {
        authContext?: { userId: string };
        controllers: {
          rewardController: {
            updatePurchaseStatus: (input: {
              purchaseId: string;
              newStatus: RewardPurchaseStatus;
              updatedById: string;
              collectionMethod?: string | null;
            }) => Promise<
              | {
                  success: true;
                  data: {
                    purchaseId: string;
                    rewardId: string;
                    groupId: string;
                    quantity: number;
                    totalCost: number;
                    status: string;
                    collectionMethod: string | null;
                    statusUpdatedById: string;
                    statusUpdatedAt: Date;
                    refunded: boolean;
                  };
                }
              | { success: false; error: string }
            >;
          };
        };
      },
    ) => {
      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.rewardController;
      const result = await controller.updatePurchaseStatus({
        purchaseId: args.input.purchaseId,
        newStatus: RewardPurchaseStatus.DELIVERED,
        updatedById: ctx.authContext.userId,
        collectionMethod: args.input.collectionMethod ?? null,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return {
        id: result.data.purchaseId,
        rewardId: result.data.rewardId,
        userId: ctx.authContext.userId,
        groupId: result.data.groupId,
        pointsSpent: result.data.totalCost,
        totalCost: result.data.totalCost,
        status: result.data.status,
        quantity: result.data.quantity,
        collectionMethod: result.data.collectionMethod,
        collectedAt: result.data.statusUpdatedAt,
        collectedById: result.data.statusUpdatedById,
        notes: null,
        purchasedAt: new Date(),
        updatedAt: result.data.statusUpdatedAt,
        statusUpdatedAt: result.data.statusUpdatedAt,
        statusUpdatedById: result.data.statusUpdatedById,
      };
    },
  }),

  /**
   * Cancel a reward purchase
   * This allows group leaders to cancel their own purchases
   */
  cancelRewardPurchase: t.field({
    type: RewardPurchaseType,
    args: {
      input: t.arg({ type: CancelRewardPurchaseInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          purchaseId: string;
        };
      },
      ctx: {
        authContext?: { userId: string };
        controllers: {
          rewardController: {
            updateMyPurchaseStatus: (input: {
              purchaseId: string;
              newStatus: RewardPurchaseStatus;
              updatedById: string;
            }) => Promise<
              | {
                  success: true;
                  data: {
                    purchaseId: string;
                    rewardId: string;
                    groupId: string;
                    quantity: number;
                    totalCost: number;
                    status: string;
                    statusUpdatedAt: Date;
                    refunded: boolean;
                  };
                }
              | { success: false; error: string }
            >;
          };
        };
      },
    ) => {
      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.rewardController;
      const result = await controller.updateMyPurchaseStatus({
        purchaseId: args.input.purchaseId,
        newStatus: RewardPurchaseStatus.CANCELLED,
        updatedById: ctx.authContext.userId,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return {
        id: result.data.purchaseId,
        rewardId: result.data.rewardId,
        userId: ctx.authContext.userId,
        groupId: result.data.groupId,
        pointsSpent: result.data.totalCost,
        totalCost: result.data.totalCost,
        status: result.data.status,
        quantity: result.data.quantity,
        collectionMethod: null,
        collectedAt: null,
        collectedById: null,
        notes: null,
        purchasedAt: new Date(),
        updatedAt: result.data.statusUpdatedAt,
        statusUpdatedAt: result.data.statusUpdatedAt,
        statusUpdatedById: ctx.authContext.userId,
      };
    },
  }),
}));
