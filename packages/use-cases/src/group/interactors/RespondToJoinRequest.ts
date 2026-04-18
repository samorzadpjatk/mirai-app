import { Effect } from "effect";
import { GroupJoinRequest, GroupJoinRequestId, UserId, GroupId, TripParticipant } from "@mirai-app/domain";
import { GroupPortTag } from "../ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPortTag } from "../ports/GroupJoinRequestPort";
import type { JoinRequestResponseDTO } from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";
import {
  GroupNotFoundError,
  JoinRequestNotFoundError,
  NotGroupOrganizerError,
  AlreadyInGroupError,
  TripHasEndedError,
} from "../errors/GroupErrors";

/**
 * Input for RespondToJoinRequestUseCase
 */
export interface RespondToJoinRequestInput {
  requestId: string;
  userId: string;
  decision: "ACCEPT" | "REJECT";
}

/**
 * Respond To Join Request Use Case
 *
 * Accepts or rejects a join request (organizer only).
 */
export class RespondToJoinRequestUseCase {
  execute(input: RespondToJoinRequestInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const joinRequestPort = yield* GroupJoinRequestPortTag;

      const requesterUserId = UserId.unsafeCreate(input.userId);

      // Find the request
      const requestId = GroupJoinRequestId.unsafeCreate(input.requestId);
      const request = yield* joinRequestPort.findById(requestId);

      if (!request) {
        return yield* Effect.fail(
          new JoinRequestNotFoundError({ requestId: input.requestId }),
        );
      }

      // Find the group
      const group = yield* groupPort.findById(request.groupId);

      if (!group || group.isDeleted) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: GroupId.toString(request.groupId) }),
        );
      }

      // Check if user is the organizer
      if (!UserId.equals(group.organizerId, requesterUserId)) {
        return yield* Effect.fail(
          new NotGroupOrganizerError({
            userId: input.userId,
            groupId: GroupId.toString(group.id),
          }),
        );
      }

      // If rejecting, just delete the request
      if (input.decision === "REJECT") {
        yield* joinRequestPort.delete(request.id);
        return { status: "REJECTED", requestId: request.id };
      }

      // For accept, check if user is already in another group
      const participant = yield* participantPort.findByUserAndTrip(
        request.userId,
        request.tripId,
      );

      if (
        participant &&
        participant.groupId &&
        !GroupId.equals(participant.groupId, request.groupId)
      ) {
        return yield* Effect.fail(
          new AlreadyInGroupError({
            userId: UserId.toString(request.userId),
            groupId: GroupId.toString(participant.groupId),
          }),
        );
      }

      // Assign user to group
      if (participant) {
        // Update existing participant with new group assignment
        const updatedParticipant = participant.assignToGroup(request.groupId);
        yield* participantPort.update(updatedParticipant);
      } else {
        // Create new participant
        const createEffect = TripParticipant.create({
          userId: request.userId,
          tripId: request.tripId,
          groupId: request.groupId,
          role: "MEMBER",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        const newParticipant = yield* createEffect;
        yield* participantPort.create(newParticipant);
      }

      // Delete all join requests for this user in this trip
      yield* joinRequestPort.deleteByUserAndTrip(
        request.userId,
        request.tripId,
      );

      return { status: "ACCEPTED", requestId: request.id };
    });
  }
}
