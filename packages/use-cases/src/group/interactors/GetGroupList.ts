import { Effect } from "effect";
import { GroupPort } from "../ports/GroupPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import type { GroupWithStatsDTO } from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";

/**
 * Input for GetGroupListUseCase
 */
export interface GetGroupListInput {
  tripId: string;
}

/**
 * Get Group List Use Case
 *
 * Retrieves group list with stats for moderators.
 */
export class GetGroupListUseCase {
  execute(
    input: GetGroupListInput,
  ): Effect.Effect<
    GroupWithStatsDTO[],
    DatabaseError,
    GroupPort | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;
      const participantPort = yield* TripParticipantPort;

      const groups = yield* groupPort.findByTripId(input.tripId);

      // Get participant counts
      const participantCounts = yield* Effect.all(
        groups.map((group) =>
          participantPort
            .findByTripId(input.tripId)
            .pipe(
              Effect.map(
                (participants) =>
                  participants.filter((p) => p.groupId === group.id).length,
              ),
            ),
        ),
      );

      return groups.map((group, index) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        image: group.image,
        code: group.code,
        coins: group.coins,
        participantCount: participantCounts[index] ?? 0,
        organizer: null, // Will be hydrated by adapter
        isDeleted: group.isDeleted,
      }));
    });
  }
}
