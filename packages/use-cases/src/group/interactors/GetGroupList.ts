import { Effect } from "effect";
import { GroupPortTag } from "../ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { UserPortTag } from "../../user/ports/UserPort";
import type { GroupMemberDTO } from "../dto/GroupDTOs";
import { TripId } from "@mirai-app/domain";

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
  execute(input: GetGroupListInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const userPort = yield* UserPortTag;

      const tripId = TripId.unsafeCreate(input.tripId);
      const groups = yield* groupPort.findByTripId(tripId);

      // Get participant counts
      const participantCounts = yield* Effect.all(
        groups.map((group) =>
          participantPort
            .findByTripId(tripId)
            .pipe(
              Effect.map(
                (participants) =>
                  participants.filter((p) => p.groupId === group.id).length,
              ),
            ),
        ),
      );

      // Fetch all organizers in parallel
      const organizers = yield* Effect.all(
        groups.map((group) =>
          userPort.findById(group.organizerId).pipe(
            Effect.map((user): GroupMemberDTO | null =>
              user
                ? {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: null,
                  }
                : null,
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
        organizer: organizers[index],
        isDeleted: group.isDeleted,
      }));
    });
  }
}
