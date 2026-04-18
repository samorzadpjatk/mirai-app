import { Effect } from "effect";
import { GroupPortTag } from "../ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import type { GroupRankingsDTO, GroupRankingDTO } from "../dto/GroupDTOs";
import { TripId } from "@mirai-app/domain";

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
  execute(input: GetGroupRankingsInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const participantPort = yield* TripParticipantPortTag;

      const tripId = TripId.unsafeCreate(input.tripId);

      // Get ranked groups
      const groups = yield* groupPort.getRanking(tripId);

      // Get all participants for this trip
      const allParticipants = yield* participantPort.findByTripId(tripId);

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
