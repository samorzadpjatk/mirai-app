import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";

export const coinRouter = createTRPCRouter({
    // Add coins to a group (enhanced version)
  addCoins: adminProcedure
    .input(
      z.object({
        groupId: z.string(),
        amount: z.number().min(1),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.group.update({
        where: { id: input.groupId },
        data: { coins: { increment: input.amount } },
      });

      return await ctx.db.coinTransaction.create({
        data: {
          groupId: input.groupId,
          amount: input.amount,
          adminId: ctx.session.user.id,
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
              name: true,
            },
          },
        },
      });
    }),

  // Remove coins from a group
  removeCoins: adminProcedure
    .input(
      z.object({
        groupId: z.string(),
        amount: z.number().min(1),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if group has enough coins
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
        select: { coins: true },
      });

      if (!group || group.coins < input.amount) {
        throw new Error("Grupa nie ma wystarczającej liczby monet");
      }

      await ctx.db.group.update({
        where: { id: input.groupId },
        data: { coins: { decrement: input.amount } },
      });

      return await ctx.db.coinTransaction.create({
        data: {
          groupId: input.groupId,
          amount: -input.amount, // Negative amount for removal
          adminId: ctx.session.user.id,
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
              name: true,
            },
          },
        },
      });
    }),
})