import { Effect } from "effect";
import { GroupId, TripId, UserId, TripParticipantId, TripParticipant } from "@mirai-app/domain";
import { GroupPortTag } from "../ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPortTag } from "../ports/GroupJoinRequestPort";
import {
  GroupNotFoundError,
  AlreadyInGroupError,
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
  execute(input: JoinGroupInput) {
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

      const tripId = TripId.unsafeCreate(input.tripId);

      if (!TripId.equals(group.tripId, tripId)) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      const userId = UserId.unsafeCreate(input.userId);

      // Check if user is already in the group
      const participant = yield* participantPort.findByUserAndTrip(
        userId,
        tripId,
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
      const participantToUpsert = yield* TripParticipant.create({
        id: participant?.id ?? TripParticipantId.generate(),
        userId: userId,
        tripId: tripId,
        groupId: group.id,
        wristNumber: participant?.wristNumber ?? null,
        houseNumber: participant?.houseNumber ?? null,
        role: participant?.role ?? "MEMBER",
        createdAt: participant?.createdAt ?? new Date(),
        updatedAt: new Date(),
      });
      const updatedParticipant = yield* participantPort.upsert(participantToUpsert);

      // Delete any join requests for this user in this trip
      yield* joinRequestPort.deleteByUserAndTrip(userId, tripId);

      return updatedParticipant;
    });
  }
}
