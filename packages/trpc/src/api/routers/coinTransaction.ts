import { z } from "zod";
import { createTRPCRouter, moderatorProcedure } from "../../api/trpc";

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

export const coinTransactionRouter = createTRPCRouter({
  getStatistics: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [transactionCount, addedCoins, removedCoins] = await Promise.all([
        ctx.db.coinTransaction.count({
          where: { group: { tripId: input.tripId } },
        }),
        ctx.db.coinTransaction.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            amount: {
              gt: 0,
            },
            group: { tripId: input.tripId },
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
            group: { tripId: input.tripId },
          },
        }),
      ]);
      return {
        transactionCount,
        addedCoins: addedCoins._sum.amount ?? 0,
        removedCoins: removedCoins._sum.amount ?? 0,
        netBalance:
          (addedCoins._sum.amount ?? 0) + (removedCoins._sum.amount ?? 0),
        time: new Date(),
      };
    }),
  getMostActiveAdminStats: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.coinTransaction.groupBy({
        by: ["adminId"],
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        where: { group: { tripId: input.tripId } },
        take: 1,
        orderBy: {
          _sum: {
            amount: "desc",
          },
        },
      });
    }),
  getAll: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.coinTransaction.findMany({
        where: { group: { tripId: input.tripId } },
        select: {
          id: true,
          amount: true,
          reason: true,
          createdAt: true,
          group: { select: { id: true, name: true } },
          admin: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    }),
  getQuickStats: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const totalCoins = await ctx.db.coinTransaction.aggregate({
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        where: { group: { tripId: input.tripId } },
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
        where: { group: { tripId: input.tripId } },
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
        time: new Date(),
      };
    }),
  getAdditionalInsights: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [recentTransactions, mostActiveAdminStats] = await Promise.all([
        ctx.db.coinTransaction.findMany({
          where: { group: { tripId: input.tripId } },
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
          where: { group: { tripId: input.tripId } },
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
        select: { firstName: true, lastName: true },
      });
      if (!mostActiveAdmin) return null;
      return {
        mostActiveAdmin: {
          name: formatUserFullName(mostActiveAdmin),
          transactionCount: mostActiveAdminStats[0]._count.id,
        },
        recentTransactions,
      };
    }),
  getCoinTransactions: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = input.groupId
        ? { groupId: input.groupId, group: { tripId: input.tripId } }
        : { group: { tripId: input.tripId } };
      return await ctx.db.coinTransaction.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),
});
