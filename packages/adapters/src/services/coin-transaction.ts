import { Effect } from "effect";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  coinTransactions,
  groups,
  tripParticipants,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import type { CoinTransactionController } from "../controllers/coin-transaction";
import { ServiceError } from "../errors/adapter-errors";

/**
 * DrizzleCoinTransactionService
 *
 * Handles coin transaction queries with participant and group verification.
 * Delegates to CoinTransactionController for business logic.
 */
export class DrizzleCoinTransactionService {
  constructor(
    private db: DrizzleDb,
    private controller: CoinTransactionController,
  ) {}

  /**
   * Get coin transactions for a user (with participant and group verification)
   */
  getCoinTransactionsForUser(input: {
    userId: string;
    tripId: string;
    groupId?: string;
    limit: number;
  }): Effect.Effect<
    | {
        success: true;
        data: Array<{
          id: string;
          amount: number;
          reason: string | null;
          createdAt: Date;
          group: { id: string; name: string; coins: number } | null;
          admin: {
            id: string;
            firstName: string | null;
            lastName: string | null;
          } | null;
        }>;
      }
    | { success: false; error: string },
    ServiceError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        // Verify participant
        const [participant] = await this.db
          .select({ userId: tripParticipants.userId })
          .from(tripParticipants)
          .where(
            and(
              eq(tripParticipants.userId, input.userId),
              eq(tripParticipants.tripId, input.tripId),
            ),
          )
          .limit(1);

        if (!participant) {
          return {
            success: false as const,
            error: "You are not a participant of this trip",
          };
        }

        // Verify group if specified
        if (input.groupId) {
          const [group] = await this.db
            .select({ tripId: groups.tripId, isDeleted: groups.isDeleted })
            .from(groups)
            .where(eq(groups.id, input.groupId))
            .limit(1);

          if (!group || group.tripId !== input.tripId || group.isDeleted) {
            return {
              success: false as const,
              error: "Group not found",
            };
          }
        }

        // Delegate to controller
        return this.controller.getCoinTransactions({
          tripId: input.tripId,
          groupId: input.groupId,
          limit: input.limit,
          isParticipant: true,
        });
      },
      catch: (error) =>
        new ServiceError({
          operation: "getCoinTransactionsForUser",
          message: `Failed to get coin transactions: ${String(error)}`,
          cause: error,
        }),
    });
  }
}
