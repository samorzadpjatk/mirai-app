import { Effect } from "effect";
import { GroupPort } from "../ports/GroupPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPort } from "../ports/GroupJoinRequestPort";
import type { TripParticipant } from "@mirai-app/domain";
import type { DatabaseError } from "@mirai-app/domain";
import {
  GroupNotFoundError,
  NotGroupOrganizerError,
  CannotRemoveOrganizerError,
  TripHasEndedError,
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
  execute(
    input: RemoveUserFromGroupInput,
  ): Effect.Effect<
    TripParticipant,
    | DatabaseError
    | GroupNotFoundError
    | NotGroupOrganizerError
    | CannotRemoveOrganizerError
    | TripHasEndedError,
    GroupPort | TripParticipantPort | GroupJoinRequestPort
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;
      const participantPort = yield* TripParticipantPort;
      const joinRequestPort = yield* GroupJoinRequestPort;

      // Find the participant
      const participant = yield* participantPort.findByUserAndTrip(
        input.userId,
        input.tripId,
      );

      if (!participant) {
        return yield* Effect.fail(new GroupNotFoundError({ groupId: "" }));
      }

      if (!participant.groupId) {
        return yield* Effect.fail(new GroupNotFoundError({ groupId: "" }));
      }

      // Find the group
      const group = yield* groupPort.findById(participant.groupId);

      if (!group || group.isDeleted || group.tripId !== input.tripId) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: participant.groupId }),
        );
      }

      // Check permissions
      const isOrganizer = group.organizerId === input.requestingUserId;

      if (!input.isAdmin && !isOrganizer) {
        return yield* Effect.fail(
          new NotGroupOrganizerError({
            userId: input.requestingUserId,
            groupId: group.id,
          }),
        );
      }

      // Cannot remove organizer unless admin
      if (!input.isAdmin && input.userId === group.organizerId) {
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
      const groupParticipants = yield* participantPort.findByTripId(
        input.tripId,
      );
      const remainingMembers = groupParticipants.filter(
        (p) => p.groupId === group.id,
      );

      if (remainingMembers.length === 0) {
        // Delete group if empty
        yield* joinRequestPort.deleteByGroupId(group.id);
        yield* groupPort.softDelete(group.id);
      } else if (input.userId === group.organizerId) {
        // Reassign organizer to next member
        const nextOrganizer = remainingMembers[0];
        if (nextOrganizer) {
          yield* groupPort.update({
            ...group,
            organizerId: nextOrganizer.userId,
          });
        }
      }

      return saved;
    });
  }
}
