import { Effect } from "effect";
import { GroupPort } from "../ports/GroupPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPort } from "../ports/GroupJoinRequestPort";
import type { DeleteGroupResultDTO } from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";
import {
  GroupNotFoundError,
  NotGroupOrganizerError,
  TripHasEndedError,
} from "../errors/GroupErrors";

/**
 * Input for DeleteMyGroupUseCase
 */
export interface DeleteMyGroupInput {
  groupId: string;
  userId: string;
}

/**
 * Delete My Group Use Case
 *
 * Allows a group organizer to delete their own group.
 */
export class DeleteMyGroupUseCase {
  execute(
    input: DeleteMyGroupInput,
  ): Effect.Effect<
    DeleteGroupResultDTO,
    | DatabaseError
    | GroupNotFoundError
    | NotGroupOrganizerError
    | TripHasEndedError,
    GroupPort | TripParticipantPort | GroupJoinRequestPort
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;
      const participantPort = yield* TripParticipantPort;
      const joinRequestPort = yield* GroupJoinRequestPort;

      // Find the group
      const group = yield* groupPort.findById(input.groupId);

      if (!group || group.isDeleted) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Check if user is the organizer
      if (group.organizerId !== input.userId) {
        return yield* Effect.fail(
          new NotGroupOrganizerError({
            userId: input.userId,
            groupId: input.groupId,
          }),
        );
      }

      // Remove all participants from the group
      const participants = yield* participantPort.findByTripId(group.tripId);
      const groupParticipants = participants.filter(
        (p) => p.groupId === group.id,
      );

      // Update participants to remove group assignment
      yield* Effect.all(
        groupParticipants.map((p) => {
          const updated = p.removeFromGroup();
          return participantPort.update(updated);
        }),
      );

      // Delete all join requests for this group
      yield* joinRequestPort.deleteByGroupId(group.id);

      // Soft delete the group
      yield* groupPort.softDelete(group.id);

      return {
        success: true,
        groupId: group.id,
      };
    });
  }
}
