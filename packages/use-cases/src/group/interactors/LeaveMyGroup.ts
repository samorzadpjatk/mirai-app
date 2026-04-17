import { Effect } from "effect";
import { GroupPort } from "../ports/GroupPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPort } from "../ports/GroupJoinRequestPort";
import type { LeaveGroupResultDTO } from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";
import {
  GroupNotFoundError,
  NotInGroupError,
  TripHasEndedError,
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
  execute(
    input: LeaveMyGroupInput,
  ): Effect.Effect<
    LeaveGroupResultDTO,
    DatabaseError | GroupNotFoundError | NotInGroupError | TripHasEndedError,
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

      // Find user's participant record
      const participant = yield* participantPort.findByUserAndTrip(
        input.userId,
        group.tripId,
      );

      if (!participant || participant.groupId !== group.id) {
        return yield* Effect.fail(
          new NotInGroupError({ userId: input.userId, groupId: input.groupId }),
        );
      }

      const isOrganizer = group.organizerId === input.userId;

      // Remove user from group
      const updated = participant.removeFromGroup();
      yield* participantPort.update(updated);

      // Check if group is now empty
      const groupParticipants = yield* participantPort.findByTripId(
        group.tripId,
      );
      const remainingMembers = groupParticipants.filter(
        (p) => p.groupId === group.id && p.userId !== input.userId,
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
          yield* groupPort.update({
            ...group,
            organizerId: nextOrganizerId,
          });
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
