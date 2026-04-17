import { Effect } from "effect";
import { GroupPort } from "../ports/GroupPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import type { GroupWithSubmissionsDTO } from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";
import { GroupNotFoundError } from "../errors/GroupErrors";

/**
 * Input for GetGroupByIdUseCase
 */
export interface GetGroupByIdInput {
  groupId: string;
}

/**
 * Get Group By ID Use Case
 *
 * Retrieves a group by ID with participants and approved submissions.
 */
export class GetGroupByIdUseCase {
  execute(
    input: GetGroupByIdInput,
  ): Effect.Effect<
    GroupWithSubmissionsDTO,
    DatabaseError | GroupNotFoundError,
    GroupPort | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;
      const participantPort = yield* TripParticipantPort;

      const group = yield* groupPort.findById(input.groupId);

      if (!group || group.isDeleted) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Get participants for this group
      const participants = yield* participantPort.findByTripId(group.tripId);
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
        approvedSubmissions: [], // Will be hydrated by adapter
        trip: {
          id: group.tripId,
          name: "", // Will be hydrated by adapter
        },
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      };
    });
  }
}
