import type { Prisma } from "@repo/frameworks/prisma";
import type { PrismaCoinTransactionRepository } from "../gateways/PrismaCoinTransactionRepository";
import type { AddCoinsUseCase, RemoveCoinsUseCase } from "@repo/use-cases";
import {
  PrismaRankingActivityService,
  type RankSnapshot,
} from "./PrismaRankingActivityService";

/**
 * PrismaCoinService
 *
 * Handles coin operations with activity feed integration.
 * Coordinates ranking snapshots and activity creation around coin transactions.
 */
export class PrismaCoinService {
  constructor(
    private prisma: Prisma.TransactionClient,
    private coinRepo: PrismaCoinTransactionRepository,
    private addCoinsUseCase: AddCoinsUseCase,
    private removeCoinsUseCase: RemoveCoinsUseCase,
    private rankingActivityService: PrismaRankingActivityService,
  ) {}

  /**
   * Add coins to a group with activity feed tracking
   */
  async addCoinsWithActivity(input: {
    tripId: string;
    groupId: string;
    amount: number;
    reason?: string;
    adminId: string;
  }): Promise<
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
    | { success: false; error: string }
  > {
    return this.prisma.$transaction(async (tx) => {
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
        return { success: false, error: result.error };
      }

      // Get full transaction data with relations
      const transaction = await tx.coinTransaction.findUnique({
        where: { id: result.value.transaction.id },
        include: {
          group: { select: { id: true, name: true, coins: true } },
          admin: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Create rank change activities
      await this.rankingActivityService.createRankChangeActivities({
        tx,
        tripId: input.tripId,
        previousSnapshot,
        createdByAdmin: input.adminId,
      });

      if (!transaction) {
        return {
          success: false,
          error: "Transaction not found after creation",
        };
      }

      return { success: true, data: transaction };
    });
  }

  /**
   * Remove coins from a group with activity feed tracking
   */
  async removeCoinsWithActivity(input: {
    tripId: string;
    groupId: string;
    amount: number;
    reason?: string;
    adminId: string;
  }): Promise<
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
    | { success: false; error: string }
  > {
    return this.prisma.$transaction(async (tx) => {
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
        return { success: false, error: result.error };
      }

      // Get full transaction data with relations
      const transaction = await tx.coinTransaction.findUnique({
        where: { id: result.value.transaction.id },
        include: {
          group: { select: { id: true, name: true, coins: true } },
          admin: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Create rank change activities
      await this.rankingActivityService.createRankChangeActivities({
        tx,
        tripId: input.tripId,
        previousSnapshot,
        createdByAdmin: input.adminId,
      });

      if (!transaction) {
        return {
          success: false,
          error: "Transaction not found after creation",
        };
      }

      return { success: true, data: transaction };
    });
  }
}
