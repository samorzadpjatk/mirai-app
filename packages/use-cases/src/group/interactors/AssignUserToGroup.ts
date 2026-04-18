import { Effect } from "effect";
import { GroupPortTag } from "../ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPortTag } from "../ports/GroupJoinRequestPort";
import type { TripParticipant } from "@mirai-app/domain";
import { GroupId, TripId, UserId } from "@mirai-app/domain";
import {
  GroupNotFoundError,
  AlreadyInGroupError,
} from "../errors/GroupErrors";

/**
 * Input for AssignUserToGroupUseCase
 */
export interface AssignUserToGroupInput {
  userId: string;
  tripId: string;
  groupId: string;
  assignedByUserId: string;
}

/**
 * Assign User To Group Use Case
 *
 * Assigns a user to a group.
 */
export class AssignUserToGroupUseCase {
  execute(input: AssignUserToGroupInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const joinRequestPort = yield* GroupJoinRequestPortTag;

      const groupId = GroupId.unsafeCreate(input.groupId);
      const tripId = TripId.unsafeCreate(input.tripId);
      const userId = UserId.unsafeCreate(input.userId);

      // Find the group
      const group = yield* groupPort.findById(groupId);

      if (!group || group.isDeleted || !TripId.equals(group.tripId, tripId)) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Check if user is already in the group
      const existingParticipant = yield* participantPort.findByUserAndTrip(
        userId,
        tripId,
      );

      if (existingParticipant && existingParticipant.groupId === group.id) {
        return yield* Effect.fail(
          new AlreadyInGroupError({
            userId: input.userId,
            groupId: input.groupId,
          }),
        );
      }

      // Assign user to group
      const participant = yield* participantPort.upsert({
        id: existingParticipant?.id ?? "",
        userId: userId,
        tripId: tripId,
        groupId: group.id,
        wristNumber: existingParticipant?.wristNumber ?? null,
        houseNumber: existingParticipant?.houseNumber ?? null,
        role: existingParticipant?.role ?? "MEMBER",
        createdAt: existingParticipant?.createdAt ?? new Date(),
        updatedAt: new Date(),
      } as TripParticipant);

      // Delete any join requests for this user
      yield* joinRequestPort.deleteByUserAndTrip(userId, tripId);

      return participant;
    });
  }
}
