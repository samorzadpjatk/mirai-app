import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { coinTransactions } from "@mirai-app/frameworks/drizzle/schema/coinTransaction";
import { groups } from "@mirai-app/frameworks/drizzle/schema/group";
import { tripParticipants } from "@mirai-app/frameworks/drizzle/schema/trip";
import { eq, and, desc } from "drizzle-orm";
import type { CoinTransactionController } from "../controllers/coin-transaction";

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
  async getCoinTransactionsForUser(input: {
    userId: string;
    tripId: string;
    groupId?: string;
    limit: number;
  }): Promise<
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
    | { success: false; error: string }
  > {
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
        success: false,
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
          success: false,
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
  }
}
