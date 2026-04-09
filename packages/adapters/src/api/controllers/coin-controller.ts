/**
 * Coin Controller
 *
 * tRPC-ready controller for coin operations with activity feed integration.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { moderatorProcedure } from "../trpc";
import { PrismaCoinTransactionRepository } from "../../gateways/PrismaCoinTransactionRepository";
import { PrismaCoinService } from "../../services/PrismaCoinService";
import { PrismaRankingActivityService } from "../../services/PrismaRankingActivityService";
import { AddCoinsUseCase, RemoveCoinsUseCase } from "@mirai-app/use-cases";

// Helper to create coin service from context
const createCoinService = (ctx: { db: unknown }) => {
  const coinRepo = new PrismaCoinTransactionRepository(ctx.db);
  const rankingActivityService = new PrismaRankingActivityService(ctx.db);
  return new PrismaCoinService(
    ctx.db,
    coinRepo,
    new AddCoinsUseCase(coinRepo),
    new RemoveCoinsUseCase(coinRepo),
    rankingActivityService,
  );
};

export const coinController = {
  addCoins: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        amount: z.number().min(1),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = createCoinService(ctx);

      const result = await service.addCoinsWithActivity({
        tripId: input.tripId,
        groupId: input.groupId,
        amount: input.amount,
        reason: input.reason,
        adminId: ctx.dbUser.id,
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

  removeCoins: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        amount: z.number().min(1),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = createCoinService(ctx);

      const result = await service.removeCoinsWithActivity({
        tripId: input.tripId,
        groupId: input.groupId,
        amount: input.amount,
        reason: input.reason,
        adminId: ctx.dbUser.id,
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
