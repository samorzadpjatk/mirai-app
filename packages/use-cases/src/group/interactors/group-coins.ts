import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { groups, coinTransactions } from "@mirai-app/frameworks/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { Effect } from "effect";
import { UseCaseError } from "../../system/errors";

/**
 * Manages group coin balance and transactions
 */
export class GroupCoinsInteractor {
  constructor(private db: DrizzleDb) {}

  getBalance(groupId: string): Effect.Effect<number, UseCaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [group] = await this.db
          .select({ coins: groups.coins })
          .from(groups)
          .where(eq(groups.id, groupId))
          .limit(1);
        return group?.coins ?? 0;
      },
      catch: (error) =>
        new UseCaseError({
          operation: "getBalance",
          message: `Failed to get balance for group ${groupId}: ${String(error)}`,
          cause: error,
        }),
    });
  }

  deductCoins(
    groupId: string,
    amount: number,
    reason: string,
    adminId: string,
  ): Effect.Effect<void, UseCaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db.transaction(async (tx) => {
          await tx
            .update(groups)
            .set({ coins: sql`${groups.coins} - ${amount}` })
            .where(eq(groups.id, groupId));

          await tx.insert(coinTransactions).values({
            groupId,
            tripId: (
              await tx
                .select({ tripId: groups.tripId })
                .from(groups)
                .where(eq(groups.id, groupId))
                .limit(1)
            )[0]?.tripId!,
            amount: -amount,
            reason,
            adminId,
          });
        });
      },
      catch: (error) =>
        new UseCaseError({
          operation: "deductCoins",
          message: `Failed to deduct ${amount} coins from group ${groupId}: ${String(error)}`,
          cause: error,
        }),
    });
  }

  addCoins(
    groupId: string,
    amount: number,
    reason: string,
    adminId: string,
  ): Effect.Effect<void, UseCaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db.transaction(async (tx) => {
          await tx
            .update(groups)
            .set({ coins: sql`${groups.coins} + ${amount}` })
            .where(eq(groups.id, groupId));

          const tripId = (
            await tx
              .select({ tripId: groups.tripId })
              .from(groups)
              .where(eq(groups.id, groupId))
              .limit(1)
          )[0]?.tripId;

          await tx.insert(coinTransactions).values({
            groupId,
            tripId: tripId!,
            amount,
            reason,
            adminId,
          });
        });
      },
      catch: (error) =>
        new UseCaseError({
          operation: "addCoins",
          message: `Failed to add ${amount} coins to group ${groupId}: ${String(error)}`,
          cause: error,
        }),
    });
  }
}
