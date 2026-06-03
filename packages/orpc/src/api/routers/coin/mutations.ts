import { ORPCError } from "@orpc/server";
import { eq, sql } from "drizzle-orm";
import { type DB, coinTransactions, groups } from "@mirai-app/db";
import {
  validateCoinTransaction,
  checkCoinBalance,
  buildCoinTransactionValues,
} from "@mirai-app/shared";
import {
  captureTripRankingSnapshot,
  createRankChangeActivities,
} from "../../../utils/activityFeed";
import { type CoinTransactionInput } from "./types";

export const addCoins = async (
  context: { db: DB; dbUser: { id: string } },
  input: CoinTransactionInput,
) => {
  return await context.db.transaction(async (tx) => {
    const previousRankingSnapshot = await captureTripRankingSnapshot(tx, input.tripId);

    // Verify group exists and belongs to the trip
    const group = await tx.query.groups.findFirst({
      where: (g, { eq }) => eq(g.id, input.groupId),
    });

    const validation = validateCoinTransaction(group, input);
    if (validation) {
      throw new ORPCError(validation.error, { message: validation.message });
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
      .values(buildCoinTransactionValues(input, context.dbUser.id, true))
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
};

export const removeCoins = async (
  context: { db: DB; dbUser: { id: string } },
  input: CoinTransactionInput,
) => {
  return await context.db.transaction(async (tx) => {
    const previousRankingSnapshot = await captureTripRankingSnapshot(tx, input.tripId);

    // Lock the group row for update to prevent race conditions
    const group = await tx.query.groups.findFirst({
      where: (g, { eq }) => eq(g.id, input.groupId),
    });

    const validation = validateCoinTransaction(group, input);
    if (validation) {
      throw new ORPCError(validation.error, { message: validation.message });
    }

    const balanceError = checkCoinBalance(group, input.amount);
    if (balanceError) {
      throw new ORPCError(balanceError.error, { message: balanceError.message });
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
      .values(buildCoinTransactionValues(input, context.dbUser.id, false))
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
};
