import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { groups, coinTransactions } from "@mirai-app/frameworks/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { Effect, Data } from "effect";
import type { GroupCoinsService } from "@mirai-app/use-cases";

/**
 * Error for group coins operations
 */
export class GroupCoinsServiceError extends Data.TaggedError(
  "GroupCoinsServiceError",
)<{
  operation: string;
  message: string;
  cause?: unknown;
}>() {}

/**
 * Drizzle implementation of GroupCoinsService
 *
 * Manages group coin balance and transactions
 */
export class DrizzleGroupCoinsService implements GroupCoinsService {
  constructor(private db: DrizzleDb) {}

  getBalance(
    groupId: string,
  ): Effect.Effect<number, GroupCoinsServiceError, never> {
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
        new GroupCoinsServiceError({
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
    updatedById: string,
  ): Effect.Effect<
    {
      id: string;
      groupId: string;
      amount: number;
      type: string;
      reason: string;
      createdById: string;
      createdAt: Date;
    },
    GroupCoinsServiceError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db.transaction(async (tx) => {
          await tx
            .update(groups)
            .set({ coins: sql`${groups.coins} - ${amount}` })
            .where(eq(groups.id, groupId));

          const tripId = (
            await tx
              .select({ tripId: groups.tripId })
              .from(groups)
              .where(eq(groups.id, groupId))
              .limit(1)
          )[0]?.tripId;

          const [transaction] = await tx
            .insert(coinTransactions)
            .values({
              groupId,
              tripId: tripId!,
              amount: -amount,
              reason,
              adminId: updatedById,
            })
            .returning();

          return {
            id: transaction!.id,
            groupId: transaction!.groupId,
            amount: transaction!.amount,
            type: transaction!.type,
            reason: transaction!.reason,
            createdById: transaction!.adminId,
            createdAt: transaction!.createdAt,
          };
        });

        return result;
      },
      catch: (error) =>
        new GroupCoinsServiceError({
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
    updatedById: string,
  ): Effect.Effect<
    {
      id: string;
      groupId: string;
      amount: number;
      type: string;
      reason: string;
      createdById: string;
      createdAt: Date;
    },
    GroupCoinsServiceError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db.transaction(async (tx) => {
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

          const [transaction] = await tx
            .insert(coinTransactions)
            .values({
              groupId,
              tripId: tripId!,
              amount,
              reason,
              adminId: updatedById,
            })
            .returning();

          return {
            id: transaction!.id,
            groupId: transaction!.groupId,
            amount: transaction!.amount,
            type: transaction!.type,
            reason: transaction!.reason,
            createdById: transaction!.adminId,
            createdAt: transaction!.createdAt,
          };
        });

        return result;
      },
      catch: (error) =>
        new GroupCoinsServiceError({
          operation: "addCoins",
          message: `Failed to add ${amount} coins to group ${groupId}: ${String(error)}`,
          cause: error,
        }),
    });
  }
}
