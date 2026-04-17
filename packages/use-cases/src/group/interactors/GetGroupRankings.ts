import { Effect } from "effect";
import { GroupPort } from "../ports/GroupPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import type { GroupRankingsDTO, GroupRankingDTO } from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";

/**
 * Input for GetGroupRankingsUseCase
 */
export interface GetGroupRankingsInput {
  tripId: string;
}

/**
 * Get Group Rankings Use Case
 *
 * Retrieves group rankings by coins for a trip.
 */
export class GetGroupRankingsUseCase {
  execute(
    input: GetGroupRankingsInput,
  ): Effect.Effect<
    GroupRankingsDTO,
    DatabaseError,
    GroupPort | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;
      const participantPort = yield* TripParticipantPort;

      // Get ranked groups
      const groups = yield* groupPort.getRanking(input.tripId);

      // Get all participants for this trip
      const allParticipants = yield* participantPort.findByTripId(input.tripId);

      const rankings: GroupRankingDTO[] = groups.map((group, index) => {
        const groupParticipants = allParticipants.filter(
          (p) => p.groupId === group.id,
        );

        return {
          id: group.id,
          name: group.name,
          image: group.image,
          coins: group.coins,
          rank: index + 1,
          previousRank: null, // Would need historical data
          rankChange: null,
          organizer: null, // Will be hydrated
          participants: groupParticipants.map((p) => ({
            id: p.id,
            user: {
              id: p.userId,
              firstName: "", // Will be hydrated
              lastName: "",
              email: null,
            },
            joinedAt: p.createdAt,
          })),
          coinTransactions: [], // Will be hydrated
        };
      });

      return {
        groups: rankings,
        currentDate: new Date(),
      };
    });
  }
}
