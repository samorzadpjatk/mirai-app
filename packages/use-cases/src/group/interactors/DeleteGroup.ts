import { Effect } from "effect";
import { GroupId } from "@mirai-app/domain";
import { GroupPortTag } from "../ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPortTag } from "../ports/GroupJoinRequestPort";
import type { DeleteGroupResultDTO } from "../dto/GroupDTOs";
import type { TripParticipant } from "@mirai-app/domain";
import { GroupNotFoundError } from "../errors/GroupErrors";

/**
 * Input for DeleteGroupUseCase (admin only)
 */
export interface DeleteGroupInput {
  groupId: string;
}

/**
 * Delete Group Use Case
 *
 * Soft deletes a group and removes all members (admin only).
 */
export class DeleteGroupUseCase {
  execute(input: DeleteGroupInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const joinRequestPort = yield* GroupJoinRequestPortTag;

      // Find the group
      const groupId = GroupId.unsafeCreate(input.groupId);
      const group = yield* groupPort.findById(groupId);

      if (!group || group.isDeleted) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Remove all participants from the group
      const participants = yield* participantPort.findByTripId(group.tripId);
      const groupParticipants = participants.filter(
        (p: { groupId: typeof groupId | null }) => p.groupId === group.id,
      );

      // Update participants to remove group assignment
      yield* Effect.all(
        groupParticipants.map((p: { removeFromGroup: () => TripParticipant }) => {
          const updated = p.removeFromGroup();
          return participantPort.update(updated);
        }),
      );

      // Delete all join requests for this group
      yield* joinRequestPort.deleteByGroupId(group.id);

      // Soft delete the group
      yield* groupPort.softDelete(groupId);

      return {
        success: true,
        groupId: group.id,
      } as DeleteGroupResultDTO;
    });
  }
}
