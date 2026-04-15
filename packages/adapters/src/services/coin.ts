import { Effect } from "effect";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  coinTransactions,
  groups,
  users,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import type { addCoinsUseCase, removeCoinsUseCase } from "@mirai-app/use-cases";
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
    private addCoins: typeof addCoinsUseCase,
    private removeCoins: typeof removeCoinsUseCase,
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
    return Effect.gen(this, function* () {
      // Capture ranking snapshot before operation
      const previousSnapshot = yield* this.rankingActivityService
        .captureTripRankingSnapshot(this.db, input.tripId)
        .pipe(
          Effect.catchAll((error) =>
            Effect.fail(
              new ServiceError({
                operation: "addCoinsWithActivity",
                message: `Failed to capture ranking snapshot: ${error.message}`,
                cause: error,
              }),
            ),
          ),
        );

      // Execute coin operation using Effect
      const result = yield* this.addCoins({
        tripId: input.tripId,
        groupId: input.groupId,
        amount: input.amount,
        reason: input.reason,
        adminId: input.adminId,
      }).pipe(
        Effect.provideService(this.coinRepo.serviceTag, this.coinRepo),
        Effect.matchEffect({
          onFailure: (error) =>
            Effect.succeed({
              success: false as const,
              error: error instanceof Error ? error.message : String(error),
            }),
          onSuccess: (output) =>
            Effect.gen(this, function* () {
              // Update group coins
              yield* Effect.tryPromise({
                try: async () => {
                  await this.db
                    .update(groups)
                    .set({ coins: sql`${groups.coins} + ${input.amount}` })
                    .where(eq(groups.id, input.groupId));
                },
                catch: (error) =>
                  new ServiceError({
                    operation: "addCoinsWithActivity",
                    message: `Failed to update group coins: ${String(error)}`,
                    cause: error,
                  }),
              });

              // Get updated group data
              const [group] = yield* Effect.tryPromise({
                try: async () =>
                  this.db
                    .select({
                      id: groups.id,
                      name: groups.name,
                      coins: groups.coins,
                    })
                    .from(groups)
                    .where(eq(groups.id, input.groupId))
                    .limit(1),
                catch: (error) =>
                  new ServiceError({
                    operation: "addCoinsWithActivity",
                    message: `Failed to fetch group: ${String(error)}`,
                    cause: error,
                  }),
              });

              if (!group) {
                return {
                  success: false as const,
                  error: "Group not found after update",
                };
              }

              // Create rank change activities
              yield* this.rankingActivityService.createRankChangeActivities({
                tx: this.db,
                tripId: input.tripId,
                previousSnapshot,
                createdByAdmin: input.adminId,
              });

              // Get admin data
              const [admin] = yield* Effect.tryPromise({
                try: async () =>
                  this.db
                    .select({
                      id: users.id,
                      firstName: users.firstName,
                      lastName: users.lastName,
                    })
                    .from(users)
                    .where(eq(users.id, input.adminId))
                    .limit(1),
                catch: (error) =>
                  new ServiceError({
                    operation: "addCoinsWithActivity",
                    message: `Failed to fetch admin: ${String(error)}`,
                    cause: error,
                  }),
              });

              return {
                success: true as const,
                data: {
                  id: output.transaction.id,
                  amount: output.transaction.amount,
                  reason: output.transaction.reason ?? null,
                  groupId: output.transaction.groupId,
                  adminId: output.transaction.adminId,
                  createdAt: output.transaction.createdAt,
                  group,
                  admin: admin ?? {
                    id: input.adminId,
                    firstName: null,
                    lastName: null,
                  },
                },
              };
            }),
        }),
      );

      return result;
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
    return Effect.gen(this, function* () {
      // Capture ranking snapshot before operation
      const previousSnapshot = yield* this.rankingActivityService
        .captureTripRankingSnapshot(this.db, input.tripId)
        .pipe(
          Effect.catchAll((error) =>
            Effect.fail(
              new ServiceError({
                operation: "removeCoinsWithActivity",
                message: `Failed to capture ranking snapshot: ${error.message}`,
                cause: error,
              }),
            ),
          ),
        );

      // Execute coin operation using Effect
      const result = yield* this.removeCoins({
        tripId: input.tripId,
        groupId: input.groupId,
        amount: input.amount,
        reason: input.reason,
        adminId: input.adminId,
      }).pipe(
        Effect.provideService(this.coinRepo.serviceTag, this.coinRepo),
        Effect.matchEffect({
          onFailure: (error) =>
            Effect.succeed({
              success: false as const,
              error: error instanceof Error ? error.message : String(error),
            }),
          onSuccess: (output) =>
            Effect.gen(this, function* () {
              // Update group coins
              yield* Effect.tryPromise({
                try: async () => {
                  await this.db
                    .update(groups)
                    .set({ coins: sql`${groups.coins} - ${input.amount}` })
                    .where(eq(groups.id, input.groupId));
                },
                catch: (error) =>
                  new ServiceError({
                    operation: "removeCoinsWithActivity",
                    message: `Failed to update group coins: ${String(error)}`,
                    cause: error,
                  }),
              });

              // Get updated group data
              const [group] = yield* Effect.tryPromise({
                try: async () =>
                  this.db
                    .select({
                      id: groups.id,
                      name: groups.name,
                      coins: groups.coins,
                    })
                    .from(groups)
                    .where(eq(groups.id, input.groupId))
                    .limit(1),
                catch: (error) =>
                  new ServiceError({
                    operation: "removeCoinsWithActivity",
                    message: `Failed to fetch group: ${String(error)}`,
                    cause: error,
                  }),
              });

              if (!group) {
                return {
                  success: false as const,
                  error: "Group not found after update",
                };
              }

              // Create rank change activities
              yield* this.rankingActivityService.createRankChangeActivities({
                tx: this.db,
                tripId: input.tripId,
                previousSnapshot,
                createdByAdmin: input.adminId,
              });

              // Get admin data
              const [admin] = yield* Effect.tryPromise({
                try: async () =>
                  this.db
                    .select({
                      id: users.id,
                      firstName: users.firstName,
                      lastName: users.lastName,
                    })
                    .from(users)
                    .where(eq(users.id, input.adminId))
                    .limit(1),
                catch: (error) =>
                  new ServiceError({
                    operation: "removeCoinsWithActivity",
                    message: `Failed to fetch admin: ${String(error)}`,
                    cause: error,
                  }),
              });

              return {
                success: true as const,
                data: {
                  id: output.transaction.id,
                  amount: output.transaction.amount,
                  reason: output.transaction.reason ?? null,
                  groupId: output.transaction.groupId,
                  adminId: output.transaction.adminId,
                  createdAt: output.transaction.createdAt,
                  group,
                  admin: admin ?? {
                    id: input.adminId,
                    firstName: null,
                    lastName: null,
                  },
                },
              };
            }),
        }),
      );

      return result;
    });
  }
}

// Type stub for DrizzleCoinTransactionRepository - to be fully implemented
import type {
  CoinTransaction,
  CoinTransactionRepository,
} from "@mirai-app/use-cases";

type DrizzleCoinTransactionRepository = CoinTransactionRepository & {
  // Additional implementation-specific properties if needed
  [key: string]: any;
};
