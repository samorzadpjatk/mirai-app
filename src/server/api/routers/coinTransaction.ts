import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";

export const coinTransactionRouter = createTRPCRouter({
  // Assign user to a group
  // Get coin transaction history
  getCoinTransactions: adminProcedure
    .input(
      z.object({
        groupId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.coinTransaction.findMany({
        where: input.groupId ? { groupId: input.groupId } : undefined,
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
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),
})