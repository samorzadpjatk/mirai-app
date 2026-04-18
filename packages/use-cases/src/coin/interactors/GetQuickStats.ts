import { Effect } from "effect";
import { CoinTransactionPortTag } from "../ports/CoinTransactionPort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import type { ApplicationError, GroupId } from "@mirai-app/domain";
import { GroupId as GroupIdFactory } from "@mirai-app/domain";

/**
 * Input for GetQuickStatsUseCase
 */
export interface GetQuickStatsInput {
  tripId: string;
}

/**
 * Quick stats result DTO
 */
export interface QuickStatsDTO {
  totalCoins: number;
  totalGroups: number;
  averageCoinsPerGroup: number;
  richestGroupName: string;
  time: Date;
}

/**
 * Get Quick Stats Use Case
 *
 * Retrieves quick statistics about coin distribution in a trip.
 */
export class GetQuickStatsUseCase {
  execute(input: GetQuickStatsInput) {
    return Effect.gen(function* () {
      const coinPort = yield* CoinTransactionPortTag;
      const groupPort = yield* GroupPortTag;

      const [totalStats, richestGroup] = yield* Effect.all([
        Effect.gen(function* () {
          const count = yield* coinPort.countByTripId(input.tripId);
          const sum = yield* coinPort.sumPositiveByTripId(input.tripId);
          return { count, sum };
        }),
        coinPort.getRichestGroup(input.tripId),
      ]);

      if (totalStats.sum === 0) {
        return null;
      }

      if (!richestGroup) {
        return null;
      }

      // Get the group name
      const group = yield* groupPort.findById(richestGroup.groupId);

      if (!group) {
        return null;
      }

      const averageCoinsPerGroup = totalStats.count
        ? Math.round(totalStats.sum / totalStats.count)
        : 0;

      return {
        totalCoins: totalStats.sum,
        totalGroups: totalStats.count,
        averageCoinsPerGroup,
        richestGroupName: group.name,
        time: new Date(),
      };
    });
  }
}
