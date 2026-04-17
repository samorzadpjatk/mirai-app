import { Effect } from "effect";
import { CoinTransactionPort } from "../ports/CoinTransactionPort";
import { GroupPort } from "../../group/ports/GroupPort";
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
  execute(
    input: GetQuickStatsInput,
  ): Effect.Effect<
    QuickStatsDTO | null,
    ApplicationError,
    CoinTransactionPort | GroupPort
  > {
    return Effect.gen(function* () {
      const coinPort = yield* CoinTransactionPort;
      const groupPort = yield* GroupPort;

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
      const group = yield* groupPort.findById(
        GroupIdFactory.toString(richestGroup.groupId),
      );

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
