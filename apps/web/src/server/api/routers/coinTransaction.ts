import { z } from "zod";
import { createTRPCRouter, moderatorProcedure } from "~/server/api/trpc";

export const coinTransactionRouter = createTRPCRouter({
  getStatistics : moderatorProcedure.query(async ({ ctx }) => {
    const [transactionCount, addedCoins, removedCoins] = await Promise.all([
      ctx.db.coinTransaction.count(),
      ctx.db.coinTransaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          amount: {
            gt: 0,
          },
        },
      }),
      ctx.db.coinTransaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          amount: {
            lt: 0,
          },
        },
      }),
    ]);
    return {
      transactionCount,
      addedCoins: addedCoins._sum.amount ?? 0,
      removedCoins: removedCoins._sum.amount ?? 0,
      netBalance: (addedCoins._sum.amount ?? 0) + (removedCoins._sum.amount ?? 0),
      time: new Date()
    };
  }),
  getMostActiveAdminStats: moderatorProcedure.query(async ({ ctx }) => {
    return await ctx.db.coinTransaction.groupBy({
      by: ["adminId"],
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      take: 1,
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
    });
  }),
  getAll: moderatorProcedure.query(async ({ ctx }) => {
    return await ctx.db.coinTransaction.findMany({
      select: {
        id: true,
        amount: true,
        reason: true,
        createdAt: true,
        group: { select: { id: true, name: true } },
        admin: { select: { id: true, name: true } },
      },
    });
  }),
  getQuickStats: moderatorProcedure.query(async ({ ctx }) => {
    const totalCoins = await ctx.db.coinTransaction.aggregate({
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });
    if (!totalCoins._sum.amount) return null;
    const averageCoinsPerGroup = totalCoins._count.id
      ? Math.round(totalCoins._sum.amount / totalCoins._count.id)
      : 0;
    const richestGroupId = await ctx.db.coinTransaction.groupBy({
      by: ["groupId"],
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
      take: 1,
    });
    const richestGroupName = await ctx.db.group.findUnique({
      where: {
        id: richestGroupId[0]?.groupId,
      },
      select: {
        name: true,
      },
    });
    if (!richestGroupName) return null;
    return {
      totalCoins: totalCoins._sum.amount,
      totalGroups: totalCoins._count.id,
      averageCoinsPerGroup,
      richestGroupName: richestGroupName.name,
      time: new Date()
    };
  }),
  getAdditionalInsights: moderatorProcedure.query(async ({ ctx }) => {
    const [recentTransactions, mostActiveAdminStats] = await Promise.all([
      ctx.db.coinTransaction.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          reason: true,
          createdAt: true,
          group: { select: { name: true } },
        },
        take: 5,
      }),
      ctx.db.coinTransaction.groupBy({
        by: ["adminId"],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 1,
      }),
    ]);
    if (recentTransactions.length === 0 || !mostActiveAdminStats[0])
      return null;
    const mostActiveAdmin = await ctx.db.user.findUnique({
      where: { id: mostActiveAdminStats[0].adminId },
      select: { name: true },
    });
    if (!mostActiveAdmin) return null;
    return {
      mostActiveAdmin: {
        name: mostActiveAdmin.name,
        transactionCount: mostActiveAdminStats[0]._count.id,
      },
      recentTransactions,
    };
  }),
  getCoinTransactions: moderatorProcedure
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
});
