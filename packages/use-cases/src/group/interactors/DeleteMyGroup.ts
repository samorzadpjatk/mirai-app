import { Effect } from "effect";
import { GroupPortTag } from "../ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPortTag } from "../ports/GroupJoinRequestPort";
import type { DeleteGroupResultDTO } from "../dto/GroupDTOs";
import { GroupId, UserId } from "@mirai-app/domain";
import {
  GroupNotFoundError,
  NotGroupOrganizerError,
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
  execute(input: DeleteMyGroupInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const joinRequestPort = yield* GroupJoinRequestPortTag;

      const groupId = GroupId.unsafeCreate(input.groupId);
      const userId = UserId.unsafeCreate(input.userId);

      // Find the group
      const group = yield* groupPort.findById(groupId);

      if (!group || group.isDeleted) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Check if user is the organizer
      if (!UserId.equals(group.organizerId, userId)) {
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
