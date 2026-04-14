import { Effect } from "effect";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  coinTransactions,
  groups,
  users,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import type { AddCoinsUseCase, RemoveCoinsUseCase } from "@mirai-app/use-cases";
import type { DrizzleRankingActivityService } from "./ranking-activity";
import { ServiceError } from "@mirai-app/adapters/errors";

/**
 * DrizzleCoinService
 *
 * Handles coin operations with activity feed integration.
 * Coordinates ranking snapshots and activity creation around coin transactions.
 */
export class DrizzleCoinService {
  constructor(
    private db: DrizzleDb,
    private coinRepo: DrizzleCoinTransactionRepository,
    private addCoinsUseCase: AddCoinsUseCase,
    private removeCoinsUseCase: RemoveCoinsUseCase,
    private rankingActivityService: DrizzleRankingActivityService,
  ) {}

  /**
   * Add coins to a group with activity feed tracking
   */
  addCoinsWithActivity(input: {
    tripId: string;
    groupId: string;
    amount: number;
    reason?: string;
    adminId: string;
  }): Effect.Effect<
    | {
        success: true;
        data: {
          id: string;
          amount: number;
          reason: string | null;
          groupId: string;
          adminId: string;
          createdAt: Date;
          group: { id: string; name: string; coins: number };
          admin: {
            id: string;
            firstName: string | null;
            lastName: string | null;
          };
        };
      }
    | { success: false; error: string },
    ServiceError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        return this.db.transaction(async (tx) => {
          // Capture ranking snapshot before operation
          const previousSnapshot =
            await this.rankingActivityService.captureTripRankingSnapshot(
              tx,
              input.tripId,
            );

          // Execute coin operation
          const result = await this.addCoinsUseCase.execute({
            tripId: input.tripId,
            groupId: input.groupId,
            amount: input.amount,
            reason: input.reason,
            adminId: input.adminId,
          });

          if (result.kind === "err") {
            return { success: false as const, error: result.error };
          }

          // Update group coins
          await tx
            .update(groups)
            .set({ coins: sql`${groups.coins} + ${input.amount}` })
            .where(eq(groups.id, input.groupId));

          // Get updated group data
          const [group] = await tx
            .select({
              id: groups.id,
              name: groups.name,
              coins: groups.coins,
            })
            .from(groups)
            .where(eq(groups.id, input.groupId))
            .limit(1);

          // Create rank change activities
          await this.rankingActivityService.createRankChangeActivities({
            tx,
            tripId: input.tripId,
            previousSnapshot,
            createdByAdmin: input.adminId,
          });

          if (!group) {
            return {
              success: false as const,
              error: "Group not found after update",
            };
          }

          // Get admin data
          const [admin] = await tx
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
            })
            .from(users)
            .where(eq(users.id, input.adminId))
            .limit(1);

          return {
            success: true as const,
            data: {
              ...result.value.transaction,
              group,
              admin: admin ?? {
                id: input.adminId,
                firstName: null,
                lastName: null,
              },
            },
          };
        });
      },
      catch: (error) =>
        new ServiceError({
          operation: "addCoinsWithActivity",
          message: `Failed to add coins: ${String(error)}`,
          cause: error,
        }),
    });
  }

  /**
   * Remove coins from a group with activity feed tracking
   */
  removeCoinsWithActivity(input: {
    tripId: string;
    groupId: string;
    amount: number;
    reason?: string;
    adminId: string;
  }): Effect.Effect<
    | {
        success: true;
        data: {
          id: string;
          amount: number;
          reason: string | null;
          groupId: string;
          adminId: string;
          createdAt: Date;
          group: { id: string; name: string; coins: number };
          admin: {
            id: string;
            firstName: string | null;
            lastName: string | null;
          };
        };
      }
    | { success: false; error: string },
    ServiceError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        return this.db.transaction(async (tx) => {
          // Capture ranking snapshot before operation
          const previousSnapshot =
            await this.rankingActivityService.captureTripRankingSnapshot(
              tx,
              input.tripId,
            );

          // Execute coin operation
          const result = await this.removeCoinsUseCase.execute({
            tripId: input.tripId,
            groupId: input.groupId,
            amount: input.amount,
            reason: input.reason,
            adminId: input.adminId,
          });

          if (result.kind === "err") {
            return { success: false as const, error: result.error };
          }

          // Update group coins
          await tx
            .update(groups)
            .set({ coins: sql`${groups.coins} - ${input.amount}` })
            .where(eq(groups.id, input.groupId));

          // Get updated group data
          const [group] = await tx
            .select({
              id: groups.id,
              name: groups.name,
              coins: groups.coins,
            })
            .from(groups)
            .where(eq(groups.id, input.groupId))
            .limit(1);

          // Create rank change activities
          await this.rankingActivityService.createRankChangeActivities({
            tx,
            tripId: input.tripId,
            previousSnapshot,
            createdByAdmin: input.adminId,
          });

          if (!group) {
            return {
              success: false as const,
              error: "Group not found after update",
            };
          }

          // Get admin data
          const [admin] = await tx
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
            })
            .from(users)
            .where(eq(users.id, input.adminId))
            .limit(1);

          return {
            success: true as const,
            data: {
              ...result.value.transaction,
              group,
              admin: admin ?? {
                id: input.adminId,
                firstName: null,
                lastName: null,
              },
            },
          };
        });
      },
      catch: (error) =>
        new ServiceError({
          operation: "removeCoinsWithActivity",
          message: `Failed to remove coins: ${String(error)}`,
          cause: error,
        }),
    });
  }
}

// Type stub for DrizzleCoinTransactionRepository - to be fully implemented
import type { CoinTransaction } from "@mirai-app/use-cases";
type DrizzleCoinTransactionRepository = {
  create(data: {
    tripId: string;
    groupId: string;
    amount: number;
    reason?: string;
    adminId: string;
  }): Promise<CoinTransaction>;
};
