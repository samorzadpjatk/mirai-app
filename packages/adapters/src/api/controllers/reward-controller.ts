/**
 * Reward Controller
 *
 * tRPC-ready controller wrapping RewardController with proper procedure types.
 * Auth is handled at the controller level - uses publicProcedure and extracts
 * token from HTTP headers.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../trpc";
import { RewardController } from "../../controllers/reward-controller";
import {
  PrismaRewardRepository,
  PrismaRewardPurchaseRepository,
} from "../../gateways/PrismaRewardRepository";
import { PrismaTripPointsCalculator } from "../../services/PrismaTripPointsCalculator";
import { PrismaGroupCoinsService } from "../../services/PrismaGroupCoinsService";
import { PrismaTripAccessChecker } from "../../services/PrismaTripAccessChecker";
import { requireAuth, requireModerator } from "../controller-helpers";

// Helper to create reward controller with dependencies
const createRewardController = (ctx: { db: unknown }) => {
  const rewardRepo = new PrismaRewardRepository(ctx.db);
  const purchaseRepo = new PrismaRewardPurchaseRepository(ctx.db);
  const pointsCalculator = new PrismaTripPointsCalculator(ctx.db);
  const coinsService = new PrismaGroupCoinsService(ctx.db);
  const accessChecker = new PrismaTripAccessChecker(ctx.db);
  return new RewardController(
    rewardRepo,
    purchaseRepo,
    pointsCalculator,
    coinsService,
    accessChecker,
  );
};

export const rewardController = {
  getByTrip: publicProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Require authentication
      await requireAuth(ctx.headers, ctx.di);

      const controller = createRewardController(ctx);

      const result = await controller.getByTrip({
        tripId: input.tripId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getByTripAdmin: publicProcedure
    .input(
      z.object({
        tripId: z.string(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(30),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const controller = createRewardController(ctx);
      const result = await controller.getByTripAdmin({
        tripId: input.tripId,
        pagination: input.pagination,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Require authentication
      await requireAuth(ctx.headers, ctx.di);

      const controller = createRewardController(ctx);

      const result = await controller.getById({ rewardId: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found") ? "NOT_FOUND" : "FORBIDDEN",
          message: result.error,
        });
      }
      return result.data;
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        availableQuantity: z.number().int().min(0),
        image: z.string().optional(),
        images: z.array(z.string()).optional(),
        coinCost: z.number().int().min(1).max(100),
        isHidden: z.boolean().optional(),
        tripId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require moderator or admin role
      const authContext = await requireModerator(ctx.headers, ctx.di);

      const controller = createRewardController(ctx);
      const images =
        input.images && input.images.length > 0
          ? input.images
          : input.image
            ? [input.image]
            : [];

      const result = await controller.create({
        name: input.name,
        description: input.description,
        availableQuantity: input.availableQuantity,
        coinCostPercentage: input.coinCost,
        images,
        isHidden: input.isHidden,
        tripId: input.tripId,
        createdById: authContext.userId,
        creatorRole: authContext.role,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        availableQuantity: z.number().int().min(0).optional(),
        image: z.string().nullable().optional(),
        images: z.array(z.string()).optional(),
        coinCost: z.number().int().min(1).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const controller = createRewardController(ctx);
      const images =
        input.images !== undefined
          ? input.images
          : input.image !== undefined
            ? input.image
              ? [input.image]
              : []
            : undefined;

      const result = await controller.update({
        rewardId: input.id,
        name: input.name,
        description: input.description,
        availableQuantity: input.availableQuantity,
        images,
        coinCostPercentage: input.coinCost,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  setHidden: publicProcedure
    .input(
      z.object({
        id: z.string(),
        isHidden: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const controller = createRewardController(ctx);
      const result = await controller.setHidden({
        rewardId: input.id,
        isHidden: input.isHidden,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const controller = createRewardController(ctx);
      const result = await controller.delete({ rewardId: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  purchase: publicProcedure
    .input(
      z.object({
        rewardId: z.string(),
        quantity: z.number().int().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require authentication
      const authContext = await requireAuth(ctx.headers, ctx.di);

      const controller = createRewardController(ctx);
      const result = await controller.purchase({
        rewardId: input.rewardId,
        quantity: input.quantity,
        userId: authContext.userId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : result.error.includes("coin")
              ? "PRECONDITION_FAILED"
              : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  updateMyPurchaseStatus: publicProcedure
    .input(
      z.object({
        purchaseId: z.string(),
        status: z.enum(["IN_DELIVERY", "CANCELLED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require authentication
      const authContext = await requireAuth(ctx.headers, ctx.di);

      const controller = createRewardController(ctx);
      const result = await controller.updateMyPurchaseStatus({
        purchaseId: input.purchaseId,
        status: input.status,
        userId: authContext.userId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found") ? "NOT_FOUND" : "FORBIDDEN",
          message: result.error,
        });
      }
      return result.data;
    }),

  updatePurchaseStatus: publicProcedure
    .input(
      z.object({
        purchaseId: z.string(),
        status: z.enum([
          "BOUGHT",
          "ACCEPTED",
          "IN_DELIVERY",
          "CANCELLED",
          "DELIVERED",
        ]),
        collectionMethod: z.string().trim().min(1).max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require moderator or admin role
      const authContext = await requireModerator(ctx.headers, ctx.di);

      const controller = createRewardController(ctx);
      const result = await controller.updatePurchaseStatus({
        purchaseId: input.purchaseId,
        status: input.status,
        updatedById: authContext.userId,
        collectionMethod: input.collectionMethod,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getPurchaseHistory: publicProcedure
    .input(
      z.object({
        tripId: z.string(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(30),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Require authentication
      const authContext = await requireAuth(ctx.headers, ctx.di);

      const controller = createRewardController(ctx);
      const result = await controller.getPurchaseHistory({
        userId: authContext.userId,
        tripId: input.tripId,
        isStaff:
          authContext.role === "ADMIN" || authContext.role === "MODERATOR",
        pagination: input.pagination,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found") ? "NOT_FOUND" : "FORBIDDEN",
          message: result.error,
        });
      }
      return result.data;
    }),

  getTotalAvailablePoints: publicProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const controller = createRewardController(ctx);
      const result = await controller.getTotalAvailablePoints({
        tripId: input.tripId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),
};
