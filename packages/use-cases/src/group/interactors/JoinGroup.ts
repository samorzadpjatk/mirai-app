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
 * Input for JoinGroupUseCase (admin only)
 */
export interface JoinGroupInput {
  groupId: string;
  tripId: string;
  userId: string;
}

/**
 * Join Group Use Case
 *
 * Allows admin to directly join/add a user to a group.
 */
export class JoinGroupUseCase {
  execute(
    input: JoinGroupInput,
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

      if (!group || group.isDeleted) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      if (group.tripId !== input.tripId) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Check if user is already in the group
      const participant = yield* participantPort.findByUserAndTrip(
        input.userId,
        input.tripId,
      );

      if (participant && participant.groupId === group.id) {
        return yield* Effect.fail(
          new AlreadyInGroupError({
            userId: input.userId,
            groupId: input.groupId,
          }),
        );
      }

      // Assign user to group and clean up join requests
      const updatedParticipant = yield* participantPort.upsert({
        id: participant?.id ?? "",
        userId: input.userId,
        tripId: input.tripId,
        groupId: group.id,
        wristNumber: participant?.wristNumber ?? null,
        houseNumber: participant?.houseNumber ?? null,
        role: participant?.role ?? "MEMBER",
        createdAt: participant?.createdAt ?? new Date(),
        updatedAt: new Date(),
      });

      // Delete any join requests for this user in this trip
      yield* joinRequestPort.deleteByUserAndTrip(input.userId, input.tripId);

      return updatedParticipant;
    });
  }
}
