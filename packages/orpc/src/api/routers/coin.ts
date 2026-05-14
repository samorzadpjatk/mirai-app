import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { createORPCRouter, moderatorProcedure } from "../../api/trpc";
import { eq, sql } from "drizzle-orm";
import { coinTransactions, groups } from "@mirai-app/db";
import { captureTripRankingSnapshot, createRankChangeActivities } from "../../utils/activityFeed";

export const coinRouter = createORPCRouter({
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
    .handler(async ({ context, input }) => {
      return await context.db.transaction(async (tx) => {
        const previousRankingSnapshot = await captureTripRankingSnapshot(tx, input.tripId);

        // Verify group exists and belongs to the trip
        const group = await tx.query.groups.findFirst({
          where: (g, { eq }) => eq(g.id, input.groupId),
        });

        if (group?.tripId !== input.tripId || group.isDeleted) {
          throw new ORPCError("NOT_FOUND", { message: "Group not found" });
        }

        // Update group coins within the transaction
        await tx
          .update(groups)
          .set({
            coins: sql`${groups.coins} + ${input.amount}`,
          })
          .where(eq(groups.id, input.groupId));

        // Create transaction record
        const inserted = await tx
          .insert(coinTransactions)
          .values({
            groupId: input.groupId,
            amount: input.amount,
            reason: input.reason,
            adminId: context.dbUser.id,
          })
          .returning();

        if (!inserted[0]) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create transaction" });
        }

        const transaction = await tx.query.coinTransactions.findFirst({
          where: (ct, { eq }) => eq(ct.id, inserted[0]!.id),
          with: {
            group: {
              columns: { id: true, name: true, coins: true },
            },
            admin: {
              columns: { id: true, firstName: true, lastName: true },
            },
          },
        });

        if (!transaction) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to retrieve created transaction",
          });
        }

        await createRankChangeActivities({
          tx,
          tripId: input.tripId,
          previousSnapshot: previousRankingSnapshot,
          createdByAdmin: context.dbUser.id,
        });

        return transaction;
      });
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
    .handler(async ({ context, input }) => {
      return await context.db.transaction(async (tx) => {
        const previousRankingSnapshot = await captureTripRankingSnapshot(tx, input.tripId);

        // Lock the group row for update to prevent race conditions
        const group = await tx.query.groups.findFirst({
          where: (g, { eq }) => eq(g.id, input.groupId),
          columns: { coins: true, tripId: true, isDeleted: true },
        });

        if (
          group?.tripId !== input.tripId ||
          group.isDeleted ||
          (group?.coins ?? 0) < input.amount
        ) {
          throw new ORPCError("BAD_REQUEST", { message: "Group does not have enough coins" });
        }

        // Update group coins within the transaction
        await tx
          .update(groups)
          .set({
            coins: sql`${groups.coins} - ${input.amount}`,
          })
          .where(eq(groups.id, input.groupId));

        // Create transaction record
        const inserted = await tx
          .insert(coinTransactions)
          .values({
            groupId: input.groupId,
            amount: -input.amount,
            reason: input.reason,
            adminId: context.dbUser.id,
          })
          .returning();

        if (!inserted[0]) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create transaction" });
        }

        const transaction = await tx.query.coinTransactions.findFirst({
          where: (ct, { eq }) => eq(ct.id, inserted[0]!.id),
          with: {
            group: {
              columns: { id: true, name: true, coins: true },
            },
            admin: {
              columns: { id: true, firstName: true, lastName: true },
            },
          },
        });

        if (!transaction) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to retrieve created transaction",
          });
        }

        await createRankChangeActivities({
          tx,
          tripId: input.tripId,
          previousSnapshot: previousRankingSnapshot,
          createdByAdmin: context.dbUser.id,
        });

        return transaction;
      });
    }),
});
