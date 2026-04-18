import { Effect } from "effect";
import { GroupPortTag } from "../ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPortTag } from "../ports/GroupJoinRequestPort";
import type { LeaveGroupResultDTO } from "../dto/GroupDTOs";
import { GroupId, UserId } from "@mirai-app/domain";
import type { Group } from "@mirai-app/domain";
import {
  GroupNotFoundError,
  NotInGroupError,
} from "../errors/GroupErrors";

/**
 * Input for LeaveMyGroupUseCase
 */
export interface LeaveMyGroupInput {
  groupId: string;
  userId: string;
}

/**
 * Leave My Group Use Case
 *
 * Allows a user to leave their current group.
 */
export class LeaveMyGroupUseCase {
  execute(input: LeaveMyGroupInput) {
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

      // Find user's participant record
      const participant = yield* participantPort.findByUserAndTrip(
        userId,
        group.tripId,
      );

      if (!participant || participant.groupId !== group.id) {
        return yield* Effect.fail(
          new NotInGroupError({ userId: input.userId, groupId: input.groupId }),
        );
      }

      const isOrganizer = UserId.equals(group.organizerId, userId);

      // Remove user from group
      const updated = participant.removeFromGroup();
      yield* participantPort.update(updated);

      // Check if group is now empty
      const groupParticipants = yield* participantPort.findByTripId(
        group.tripId,
      );
      const remainingMembers = groupParticipants.filter(
        (p) => p.groupId === group.id && !UserId.equals(p.userId, userId),
      );

      if (remainingMembers.length === 0) {
        // Delete group if empty
        yield* joinRequestPort.deleteByGroupId(group.id);
        yield* groupPort.softDelete(group.id);

        return {
          left: true,
          reassignedOrganizerId: null,
          groupDeleted: true,
        };
      }

      // If organizer left, reassign to next member
      let nextOrganizerId = null;
      if (isOrganizer) {
        const nextOrganizer = remainingMembers[0];
        if (nextOrganizer) {
          nextOrganizerId = nextOrganizer.userId;
          const updatedGroup = yield* groupPort.update({
            ...group,
            organizerId: nextOrganizerId,
          } as Group);
        }
      }

      return {
        left: true,
        reassignedOrganizerId: nextOrganizerId,
        groupDeleted: false,
      };
    });
  }
}
