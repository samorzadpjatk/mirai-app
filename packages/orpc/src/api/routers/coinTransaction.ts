import { z } from "zod";
import { ORPCError } from "@orpc/server";
import {
  createORPCRouter,
  moderatorProcedure,
  protectedProcedure,
} from "../../api/trpc";
import { eq, and, inArray, count, sql, gt, lt } from "drizzle-orm";
import { coinTransactions, groups } from "@mirai-app/db";

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
      const groupIds = await context.db.select({ id: groups.id })
        .from(groups)
        .where(and(eq(groups.tripId, input.tripId), eq(groups.isDeleted, false)));

      const groupIdList = groupIds.map((g) => g.id);

      if (groupIdList.length === 0) {
        return {
          transactionCount: 0,
          addedCoins: 0,
          removedCoins: 0,
          netBalance: 0,
          time: new Date(),
        };
      }

      const whereExpr = inArray(coinTransactions.groupId, groupIdList);

      const [transactionCountResult, addedCoinsResult, removedCoinsResult] = await Promise.all([
        context.db.select({ count: count() }).from(coinTransactions).where(whereExpr),
        context.db.select({ totalAmount: sql<number>`sum(${coinTransactions.amount})` })
          .from(coinTransactions)
          .where(and(whereExpr, gt(coinTransactions.amount, 0))),
        context.db.select({ totalAmount: sql<number>`sum(${coinTransactions.amount})` })
          .from(coinTransactions)
          .where(and(whereExpr, lt(coinTransactions.amount, 0))),
      ]);

      return {
        transactionCount: transactionCountResult[0]?.count ?? 0,
        addedCoins: addedCoinsResult[0]?.totalAmount ?? 0,
        removedCoins: removedCoinsResult[0]?.totalAmount ?? 0,
        netBalance:
          (addedCoinsResult[0]?.totalAmount ?? 0) + (removedCoinsResult[0]?.totalAmount ?? 0),
        time: new Date(),
      };
    }),
  getMostActiveAdminStats: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const groupIds = await context.db.select({ id: groups.id })
        .from(groups)
        .where(and(eq(groups.tripId, input.tripId), eq(groups.isDeleted, false)));

      const groupIdList = groupIds.map((g) => g.id);

      if (groupIdList.length === 0) {
        return [];
      }

      const result = await context.db.select({
        adminId: coinTransactions.adminId,
        totalAmount: sql<number>`sum(${coinTransactions.amount})`,
        count: count(coinTransactions.id),
      }).from(coinTransactions)
        .where(inArray(coinTransactions.groupId, groupIdList))
        .groupBy(coinTransactions.adminId)
        .orderBy(sql`sum(${coinTransactions.amount}) desc`)
        .limit(1);

      return result.map((row) => ({
        adminId: row.adminId,
        _sum: { amount: row.totalAmount },
        _count: { id: row.count },
      }));
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

      const groupIds = await context.db.select({ id: groups.id })
        .from(groups)
        .where(and(eq(groups.tripId, input.tripId), eq(groups.isDeleted, false)));

      const groupIdList = groupIds.map((g) => g.id);

      if (groupIdList.length === 0) {
        return {
          transactions: [],
          pagination: {
            total: 0,
            limit,
            offset,
            hasMore: false,
          },
        };
      }

      const whereExpr = inArray(coinTransactions.groupId, groupIdList);

      const [transactions, totalResult] = await Promise.all([
        context.db.query.coinTransactions.findMany({
          where: whereExpr,
          columns: {
            id: true,
            amount: true,
            reason: true,
            createdAt: true,
          },
          with: {
            group: {
              columns: { id: true, name: true },
            },
            admin: {
              columns: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: (ct, { desc }) => [desc(ct.createdAt)],
          limit,
          offset,
        }),
        context.db.select({ count: count() }).from(coinTransactions).where(whereExpr),
      ]);

      const total = totalResult[0]?.count ?? 0;

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
      const groupIds = await context.db.select({ id: groups.id })
        .from(groups)
        .where(and(eq(groups.tripId, input.tripId), eq(groups.isDeleted, false)));

      const groupIdList = groupIds.map((g) => g.id);

      if (groupIdList.length === 0) {
        return null;
      }

      const totalCoinsResult = await context.db.select({
        totalAmount: sql<number>`sum(${coinTransactions.amount})`,
        count: count(coinTransactions.id),
      }).from(coinTransactions)
        .where(inArray(coinTransactions.groupId, groupIdList));

      const totalCoins = totalCoinsResult[0];
      if (!totalCoins?.totalAmount) return null;

      const averageCoinsPerGroup = totalCoins.count
        ? Math.round(totalCoins.totalAmount / totalCoins.count)
        : 0;

      const richestGroupResult = await context.db.select({
        groupId: coinTransactions.groupId,
        totalAmount: sql<number>`sum(${coinTransactions.amount})`,
      }).from(coinTransactions)
        .where(inArray(coinTransactions.groupId, groupIdList))
        .groupBy(coinTransactions.groupId)
        .orderBy(sql`sum(${coinTransactions.amount}) desc`)
        .limit(1);

      const richestGroupFirst = richestGroupResult[0];
      if (!richestGroupFirst?.groupId) return null;

      const richestGroupName = await context.db.query.groups.findFirst({
        where: (g, { eq }) => eq(g.id, richestGroupFirst.groupId),
        columns: { name: true },
      });

      if (!richestGroupName) return null;

      return {
        totalCoins: totalCoins.totalAmount,
        totalGroups: totalCoins.count,
        averageCoinsPerGroup,
        richestGroupName: richestGroupName.name,
        time: new Date(),
      };
    }),
  getAdditionalInsights: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const groupIds = await context.db.select({ id: groups.id })
        .from(groups)
        .where(and(eq(groups.tripId, input.tripId), eq(groups.isDeleted, false)));

      const groupIdList = groupIds.map((g) => g.id);

      if (groupIdList.length === 0) {
        return null;
      }

      const whereExpr = inArray(coinTransactions.groupId, groupIdList);

      const [recentTransactions, mostActiveAdminStatsResult] = await Promise.all([
        context.db.query.coinTransactions.findMany({
          where: whereExpr,
          columns: {
            id: true,
            amount: true,
            reason: true,
            createdAt: true,
          },
          with: {
            group: {
              columns: { name: true },
            },
          },
          orderBy: (ct, { desc }) => [desc(ct.createdAt)],
          limit: 5,
        }),
        context.db.select({
          adminId: coinTransactions.adminId,
          count: count(coinTransactions.id),
        }).from(coinTransactions)
          .where(whereExpr)
          .groupBy(coinTransactions.adminId)
          .orderBy(sql`count(${coinTransactions.id}) desc`)
          .limit(1),
      ]);

      if (recentTransactions.length === 0 || !mostActiveAdminStatsResult[0])
        return null;

      const firstAdminStat = mostActiveAdminStatsResult[0];
      const mostActiveAdmin = await context.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, firstAdminStat.adminId),
        columns: { firstName: true, lastName: true },
      });

      if (!mostActiveAdmin) return null;

      return {
        mostActiveAdmin: {
          name: formatUserFullName(mostActiveAdmin),
          transactionCount: firstAdminStat.count,
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
      const participant = await context.db.query.tripParticipants.findFirst({
        where: (tp, { and, eq }) => and(
          eq(tp.userId, context.dbUser.id),
          eq(tp.tripId, input.tripId),
        ),
        columns: { userId: true },
      });

      if (!participant) {
        throw new ORPCError("FORBIDDEN", { message: "You are not a participant of this trip" });
      }

      const groupId = input.groupId;
      if (groupId) {
        const group = await context.db.query.groups.findFirst({
          where: (g, { eq }) => eq(g.id, groupId),
        });

        if (!group?.tripId || group.tripId !== input.tripId || group.isDeleted) {
          throw new ORPCError("NOT_FOUND", { message: "Group not found" });
        }
      }

      let whereExpr;
      if (input.groupId) {
        whereExpr = eq(coinTransactions.groupId, input.groupId);
      } else {
        const groupIds = await context.db.select({ id: groups.id })
          .from(groups)
          .where(and(eq(groups.tripId, input.tripId), eq(groups.isDeleted, false)));
        whereExpr = inArray(coinTransactions.groupId, groupIds.map((g) => g.id));
      }

      return await context.db.query.coinTransactions.findMany({
        where: whereExpr,
        with: {
          group: {
            columns: {
              id: true,
              name: true,
              coins: true,
            },
          },
          admin: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: (ct, { desc }) => [desc(ct.createdAt)],
        limit: input.limit,
      });
    }),
});
