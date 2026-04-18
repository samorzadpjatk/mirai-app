import { Effect } from "effect";
import { GroupPortTag } from "../ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPortTag } from "../ports/GroupJoinRequestPort";
import type { TripParticipant } from "@mirai-app/domain";
import { TripId, UserId } from "@mirai-app/domain";
import type { Group } from "@mirai-app/domain";
import {
  GroupNotFoundError,
  NotGroupOrganizerError,
  CannotRemoveOrganizerError,
} from "../errors/GroupErrors";

/**
 * Input for RemoveUserFromGroupUseCase
 */
export interface RemoveUserFromGroupInput {
  userId: string;
  tripId: string;
  requestingUserId: string;
  isAdmin: boolean;
}

/**
 * Remove User From Group Use Case
 *
 * Removes a user from a group (organizer or admin).
 */
export class RemoveUserFromGroupUseCase {
  execute(input: RemoveUserFromGroupInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const joinRequestPort = yield* GroupJoinRequestPortTag;

      const userId = UserId.unsafeCreate(input.userId);
      const tripId = TripId.unsafeCreate(input.tripId);
      const requestingUserId = UserId.unsafeCreate(input.requestingUserId);

      // Find the participant
      const participant = yield* participantPort.findByUserAndTrip(
        userId,
        tripId,
      );

      if (!participant) {
        return yield* Effect.fail(new GroupNotFoundError({ groupId: "" }));
      }

      if (!participant.groupId) {
        return yield* Effect.fail(new GroupNotFoundError({ groupId: "" }));
      }

      // Find the group
      const group = yield* groupPort.findById(participant.groupId);

      if (!group || group.isDeleted || !TripId.equals(group.tripId, tripId)) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: participant.groupId }),
        );
      }

      // Check permissions
      const isOrganizer = UserId.equals(group.organizerId, requestingUserId);

      if (!input.isAdmin && !isOrganizer) {
        return yield* Effect.fail(
          new NotGroupOrganizerError({
            userId: input.requestingUserId,
            groupId: group.id,
          }),
        );
      }

      // Cannot remove organizer unless admin
      if (!input.isAdmin && UserId.equals(userId, group.organizerId)) {
        return yield* Effect.fail(
          new CannotRemoveOrganizerError({
            groupId: group.id,
            organizerId: group.organizerId,
          }),
        );
      }

      // Remove user from group
      const updated = participant.removeFromGroup();
      const saved = yield* participantPort.update(updated);

      // Check if group is now empty
      const groupParticipants = yield* participantPort.findByTripId(tripId);
      const remainingMembers = groupParticipants.filter(
        (p) => p.groupId === group.id,
      );

      if (remainingMembers.length === 0) {
        // Delete group if empty
        yield* joinRequestPort.deleteByGroupId(group.id);
        yield* groupPort.softDelete(group.id);
      } else if (UserId.equals(userId, group.organizerId)) {
        // Reassign organizer to next member
        const nextOrganizer = remainingMembers[0];
        if (nextOrganizer) {
          yield* groupPort.update({
            ...group,
            organizerId: nextOrganizer.userId,
          } as Group);
        }
      }

      return saved;
    });
  }
}
