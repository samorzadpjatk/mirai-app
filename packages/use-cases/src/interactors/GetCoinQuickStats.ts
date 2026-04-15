import { Effect } from "effect";
import { CoinTransactionRepositoryTag } from "../ports/CoinTransactionRepository";
import { GroupRepositoryTag } from "../ports/GroupRepository";

/**
 * Input for GetCoinQuickStats use case
 */
export interface GetCoinQuickStatsInput {
  tripId: string;
}

/**
 * Output for GetCoinQuickStats use case
 */
export interface GetCoinQuickStatsOutput {
  totalCoins: number;
  totalGroups: number;
  averageCoinsPerGroup: number;
  richestGroupId?: string;
  richestGroupName?: string;
  time: Date;
}

/**
 * GetCoinQuickStats Use Case
 *
 * Retrieves quick statistics about coin distribution for a trip.
 * Includes total coins, total groups, average, and richest group.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getCoinQuickStatsUseCase(input).pipe(
 *   Effect.provideService(CoinTransactionRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getCoinQuickStatsUseCase(
  input: GetCoinQuickStatsInput,
): Effect.Effect<
  GetCoinQuickStatsOutput | null,
  never,
  CoinTransactionRepositoryTag | GroupRepositoryTag
> {
  return Effect.gen(function* () {
    const repo = yield* CoinTransactionRepositoryTag;
    const groupRepo = yield* GroupRepositoryTag;

    const totalSum = yield* repo.sumAmount({ tripId: input.tripId });

    if (totalSum === null || totalSum === undefined) {
      return null;
    }

    const totalCoins = totalSum;
    const transactionCount = yield* repo.count({
      tripId: input.tripId,
    });
    const totalGroups = transactionCount;

    const averageCoinsPerGroup =
      totalGroups > 0 ? Math.round(totalCoins / totalGroups) : 0;

    const groupsByCoins = yield* repo.getTotalCoinsByGroup(input.tripId);

    if (!groupsByCoins || groupsByCoins.length === 0) {
      return {
        totalCoins,
        totalGroups,
        averageCoinsPerGroup,
        time: new Date(),
      };
    }

    // Find richest group
    const richest = groupsByCoins.reduce((max, current) => {
      const currentAmount = current._sum.amount ?? 0;
      const maxAmount = max?._sum.amount ?? 0;
      return currentAmount > maxAmount ? current : max;
    }, groupsByCoins[0]);

    const output: GetCoinQuickStatsOutput = {
      totalCoins,
      totalGroups,
      averageCoinsPerGroup,
      time: new Date(),
    };

    if (richest?.groupId) {
      output.richestGroupId = richest.groupId;

      // Resolve group name through repository
      const group = yield* groupRepo.findById(richest.groupId);
      if (group) {
        output.richestGroupName = group.name;
      }
    }

    return output;
  });
}
