import { Effect } from "effect";
import { GroupPort } from "../ports/GroupPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import type { GroupWithParticipantsDTO } from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";
import { GroupNotFoundError } from "../errors/GroupErrors";

/**
 * Input for GetMyGroupUseCase
 */
export interface GetMyGroupInput {
  userId: string;
  tripId: string;
}

/**
 * Get My Group Use Case
 *
 * Retrieves the current user's group with participants.
 */
export class GetMyGroupUseCase {
  execute(
    input: GetMyGroupInput,
  ): Effect.Effect<
    GroupWithParticipantsDTO | null,
    DatabaseError | GroupNotFoundError,
    GroupPort | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;
      const participantPort = yield* TripParticipantPort;

      // Find user's participant record for this trip
      const participant = yield* participantPort.findByUserAndTrip(
        input.userId,
        input.tripId,
      );

      if (!participant || !participant.groupId) {
        return null;
      }

      // Get the group
      const group = yield* groupPort.findById(participant.groupId);

      if (!group || group.isDeleted) {
        return null;
      }

      // Get all participants for this group
      const participants = yield* participantPort.findByTripId(input.tripId);
      const groupParticipants = participants.filter(
        (p) => p.groupId === group.id,
      );

      return {
        id: group.id,
        tripId: group.tripId,
        name: group.name,
        description: group.description,
        image: group.image,
        code: group.code,
        coins: group.coins,
        isDeleted: group.isDeleted,
        organizer: null, // Will be hydrated by adapter
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
        coinTransactions: [], // Will be hydrated by adapter
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      };
    });
  }
}
