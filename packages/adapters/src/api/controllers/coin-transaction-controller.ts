/**
 * Coin Transaction Controller
 *
 * tRPC-ready controller wrapping CoinTransactionController with proper procedure types.
 * Auth is handled at the controller level - uses publicProcedure and extracts
 * token from HTTP headers.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../trpc";
import { CoinTransactionController } from "../../controllers/coin-transaction-controller";
import { PrismaCoinTransactionRepository } from "../../gateways/PrismaCoinTransactionRepository";
import { PrismaCoinTransactionService } from "../../services/PrismaCoinTransactionService";
import { requireAuth, requireModerator } from "../controller-helpers";
import {
  GetCoinStatisticsUseCase,
  GetMostActiveAdminStatsUseCase,
  GetCoinTransactionsUseCase,
  GetCoinQuickStatsUseCase,
  GetCoinAdditionalInsightsUseCase,
} from "@mirai-app/use-cases";

// Helper to format user full name (presentation logic)
const formatUserFullName = (user?: {
  firstName?: string | null;
  lastName?: string | null;
}) => {
  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fullName) return fullName;
  if (user?.firstName) return user.firstName;
  if (user?.lastName) return user.lastName;
  return "Unknown user";
};

// Helper to create coin transaction controller from context
const createCoinTransactionController = (ctx: { db: unknown }) => {
  const coinRepo = new PrismaCoinTransactionRepository(ctx.db as never);
  return new CoinTransactionController(
    new GetCoinStatisticsUseCase(coinRepo),
    new GetMostActiveAdminStatsUseCase(coinRepo),
    new GetCoinTransactionsUseCase(coinRepo),
    new GetCoinQuickStatsUseCase(coinRepo),
    new GetCoinAdditionalInsightsUseCase(coinRepo),
  );
};

export const coinTransactionController = {
  getStatistics: publicProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const controller = createCoinTransactionController(ctx);
      const result = await controller.getStatistics({ tripId: input.tripId });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getMostActiveAdminStats: publicProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const controller = createCoinTransactionController(ctx);
      const result = await controller.getMostActiveAdminStats({
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

  getAll: publicProcedure
    .input(
      z.object({
        tripId: z.string(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(50),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const controller = createCoinTransactionController(ctx);
      const result = await controller.getAll({
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

  getQuickStats: publicProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const controller = createCoinTransactionController(ctx);
      const result = await controller.getQuickStats({ tripId: input.tripId });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }

      const data = result.data;

      // Get richest group name if ID exists
      if (data.richestGroupId) {
        const group = await ctx.db.group.findUnique({
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
    }),

  getAdditionalInsights: publicProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const controller = createCoinTransactionController(ctx);
      const result = await controller.getAdditionalInsights({
        tripId: input.tripId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }

      const data = result.data;

      // Resolve most active admin name
      if (data.mostActiveAdmin) {
        const admin = await ctx.db.user.findUnique({
          where: { id: data.mostActiveAdmin.name },
          select: { firstName: true, lastName: true },
        });

        if (admin) {
          return {
            mostActiveAdmin: {
              name: formatUserFullName(admin),
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
    }),

  getCoinTransactions: publicProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Require authentication
      const authContext = await requireAuth(ctx.headers, ctx.di);

      const controller = createCoinTransactionController(ctx);
      const service = new PrismaCoinTransactionService(
        ctx.db,
        new PrismaCoinTransactionRepository(ctx.db),
      );

      const result = await service.getCoinTransactionsForUser({
        userId: authContext.userId,
        tripId: input.tripId,
        groupId: input.groupId,
        limit: input.limit,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),
};
