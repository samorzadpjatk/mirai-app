import { z } from "zod";
import { ORPCError } from "@orpc/server";
import {
  createORPCRouter,
  moderatorProcedure,
  protectedProcedure,
} from "../../api/trpc";

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

export const coinTransactionRouter = createORPCRouter({
  getStatistics: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const [transactionCount, addedCoins, removedCoins] = await Promise.all([
        context.db.coinTransaction.count({
          where: { group: { tripId: input.tripId } },
        }),
        context.db.coinTransaction.aggregate({
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
        context.db.coinTransaction.aggregate({
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
    .handler(async ({ context, input }) => {
      return await context.db.coinTransaction.groupBy({
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
    .handler(async ({ context, input }) => {
      const limit = input.pagination?.limit ?? 50;
      const offset = input.pagination?.offset ?? 0;
      const where = { group: { tripId: input.tripId } };

      const [transactions, total] = await Promise.all([
        context.db.coinTransaction.findMany({
          where,
          select: {
            id: true,
            amount: true,
            reason: true,
            createdAt: true,
            group: { select: { id: true, name: true } },
            admin: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        context.db.coinTransaction.count({ where }),
      ]);

      return {
        transactions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),
  getQuickStats: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const totalCoins = await context.db.coinTransaction.aggregate({
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
      const richestGroupId = await context.db.coinTransaction.groupBy({
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
      const richestGroupName = await context.db.group.findUnique({
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
    .handler(async ({ context, input }) => {
      const [recentTransactions, mostActiveAdminStats] = await Promise.all([
        context.db.coinTransaction.findMany({
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
        context.db.coinTransaction.groupBy({
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
      const mostActiveAdmin = await context.db.user.findUnique({
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
  getCoinTransactions: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .handler(async ({ context, input }) => {
      const participant = await context.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: context.dbUser.id,
            tripId: input.tripId,
          },
        },
        select: { userId: true },
      });

      if (!participant) {
        throw new ORPCError("FORBIDDEN", { message: "You are not a participant of this trip" });
      }

      if (input.groupId) {
        const group = await context.db.group.findUnique({
          where: { id: input.groupId },
          select: { id: true, tripId: true, isDeleted: true },
        });

        if (!group?.tripId || group.tripId !== input.tripId || group.isDeleted) {
          throw new ORPCError("NOT_FOUND", { message: "Group not found" });
        }
      }

      const where = input.groupId
        ? { groupId: input.groupId, group: { tripId: input.tripId } }
        : { group: { tripId: input.tripId } };
      return await context.db.coinTransaction.findMany({
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
