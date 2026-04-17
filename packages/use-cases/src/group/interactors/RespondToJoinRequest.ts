import { Effect } from "effect";
import { GroupJoinRequest } from "@mirai-app/domain";
import { GroupPort } from "../ports/GroupPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPort } from "../ports/GroupJoinRequestPort";
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
  execute(
    input: RespondToJoinRequestInput,
  ): Effect.Effect<
    JoinRequestResponseDTO,
    | DatabaseError
    | GroupNotFoundError
    | JoinRequestNotFoundError
    | NotGroupOrganizerError
    | AlreadyInGroupError
    | TripHasEndedError,
    GroupPort | TripParticipantPort | GroupJoinRequestPort
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;
      const participantPort = yield* TripParticipantPort;
      const joinRequestPort = yield* GroupJoinRequestPort;

      // Find the request
      const request = yield* joinRequestPort.findById(input.requestId);

      if (!request) {
        return yield* Effect.fail(
          new JoinRequestNotFoundError({ requestId: input.requestId }),
        );
      }

      // Find the group
      const group = yield* groupPort.findById(request.groupId);

      if (!group || group.isDeleted) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: request.groupId }),
        );
      }

      // Check if user is the organizer
      if (group.organizerId !== input.userId) {
        return yield* Effect.fail(
          new NotGroupOrganizerError({
            userId: input.userId,
            groupId: group.id,
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
        participant.groupId !== request.groupId
      ) {
        return yield* Effect.fail(
          new AlreadyInGroupError({
            userId: request.userId,
            groupId: participant.groupId,
          }),
        );
      }

      // Assign user to group
      yield* participantPort.upsert({
        id: participant?.id ?? "",
        userId: request.userId,
        tripId: request.tripId,
        groupId: request.groupId,
        wristNumber: participant?.wristNumber ?? null,
        houseNumber: participant?.houseNumber ?? null,
        role: participant?.role ?? "MEMBER",
        createdAt: participant?.createdAt ?? new Date(),
        updatedAt: new Date(),
      });

      // Delete all join requests for this user in this trip
      yield* joinRequestPort.deleteByUserAndTrip(
        request.userId,
        request.tripId,
      );

      return { status: "ACCEPTED", requestId: request.id };
    });
  }
}
