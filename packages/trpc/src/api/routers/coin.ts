import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, moderatorProcedure } from "../../api/trpc";

export const coinRouter = createTRPCRouter({
  // Add coins to a group (enhanced version)
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
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
      });
      if (group?.tripId !== input.tripId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      await ctx.db.group.update({
        where: { id: input.groupId },
        data: { coins: { increment: input.amount } },
      });

      const transaction = await ctx.db.coinTransaction.create({
        data: {
          groupId: input.groupId,
          amount: input.amount,
          reason: input.reason,
          adminId: ctx.dbUser.id,
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

      return transaction;
    }),

  // Remove coins from a group
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
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
        select: { coins: true, tripId: true },
      });

      if (
        group?.tripId !== input.tripId ||
        (group?.coins ?? 0) < input.amount
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Group does not have enough coins",
        });
      }

      await ctx.db.group.update({
        where: { id: input.groupId },
        data: { coins: { decrement: input.amount } },
      });

      const transaction = await ctx.db.coinTransaction.create({
        data: {
          groupId: input.groupId,
          amount: -input.amount, // Negative amount for removal
          reason: input.reason,
          adminId: ctx.dbUser.id,
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

      return transaction;
    }),
});
