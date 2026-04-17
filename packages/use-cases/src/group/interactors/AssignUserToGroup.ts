import { Effect } from "effect";
import { GroupPort } from "../ports/GroupPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPort } from "../ports/GroupJoinRequestPort";
import type { TripParticipant } from "@mirai-app/domain";
import type { DatabaseError } from "@mirai-app/domain";
import {
  GroupNotFoundError,
  AlreadyInGroupError,
  TripHasEndedError,
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
  execute(
    input: AssignUserToGroupInput,
  ): Effect.Effect<
    TripParticipant,
    | DatabaseError
    | GroupNotFoundError
    | AlreadyInGroupError
    | TripHasEndedError,
    GroupPort | TripParticipantPort | GroupJoinRequestPort
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;
      const participantPort = yield* TripParticipantPort;
      const joinRequestPort = yield* GroupJoinRequestPort;

      // Find the group
      const group = yield* groupPort.findById(input.groupId);

      if (!group || group.isDeleted || group.tripId !== input.tripId) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Check if user is already in the group
      const existingParticipant = yield* participantPort.findByUserAndTrip(
        input.userId,
        input.tripId,
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
        userId: input.userId,
        tripId: input.tripId,
        groupId: group.id,
        wristNumber: existingParticipant?.wristNumber ?? null,
        houseNumber: existingParticipant?.houseNumber ?? null,
        role: existingParticipant?.role ?? "MEMBER",
        createdAt: existingParticipant?.createdAt ?? new Date(),
        updatedAt: new Date(),
      });

      // Delete any join requests for this user
      yield* joinRequestPort.deleteByUserAndTrip(input.userId, input.tripId);

      return participant;
    });
  }
}
