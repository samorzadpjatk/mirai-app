import type { Result } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type {
  CoinTransactionRepository,
  MostActiveAdminStat,
} from "../ports/CoinTransactionRepository";

/**
 * Input for GetMostActiveAdminStats use case
 */
export interface GetMostActiveAdminStatsInput {
  tripId: string;
}

/**
 * Output for GetMostActiveAdminStats use case
 */
export interface GetMostActiveAdminStatsOutput {
  adminId: string;
  totalAmount: number;
  transactionCount: number;
}

/**
 * GetMostActiveAdminStats Use Case
 *
 * Retrieves the most active admin by coin transaction volume for a trip.
 */
export class GetMostActiveAdminStatsUseCase {
  constructor(private coinRepo: CoinTransactionRepository) {}

  async execute(
    input: GetMostActiveAdminStatsInput,
  ): Promise<Result<GetMostActiveAdminStatsOutput | null, string>> {
    try {
      const stats = await this.coinRepo.getMostActiveAdmin(input.tripId);

      if (!stats || stats.length === 0) {
        return ok(null);
      }

      const topAdmin = stats[0];
      if (!topAdmin) {
        return ok(null);
      }

      return ok({
        adminId: topAdmin.adminId,
        totalAmount: topAdmin._sum.amount ?? 0,
        transactionCount: topAdmin._count.id,
      });
    } catch (error) {
      return err(
        `Failed to get most active admin stats: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
