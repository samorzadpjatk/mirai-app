import type { Prisma, PrismaClient } from "@repo/frameworks/prisma";
import type { CoinTransactionController } from "../controllers/coin-transaction-controller";

/**
 * PrismaCoinTransactionService
 *
 * Handles coin transaction queries with participant and group verification.
 * Delegates to CoinTransactionController for business logic.
 */
export class PrismaCoinTransactionService {
  constructor(
    private prisma: Prisma.TransactionClient | PrismaClient,
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
    const participant = await this.prisma.tripParticipant.findUnique({
      where: {
        userId_tripId: {
          userId: input.userId,
          tripId: input.tripId,
        },
      },
      select: { userId: true },
    });

    if (!participant) {
      return {
        success: false,
        error: "You are not a participant of this trip",
      };
    }

    // Verify group if specified
    if (input.groupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: input.groupId },
        select: { tripId: true, isDeleted: true },
      });

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
