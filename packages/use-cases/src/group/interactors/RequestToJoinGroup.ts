import { Effect } from "effect";
import { GroupJoinRequest, GroupId, UserId, TripId, GroupJoinRequestId } from "@mirai-app/domain";
import { GroupPortTag } from "../ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPortTag } from "../ports/GroupJoinRequestPort";
import {
  GroupNotFoundError,
  AlreadyInGroupError,
  JoinRequestAlreadyExistsError,
  NotTripParticipantError,
} from "../errors/GroupErrors";

/**
 * Input for RequestToJoinGroupUseCase
 */
export interface RequestToJoinGroupInput {
  groupId: string;
  userId: string;
}

/**
 * Request To Join Group Use Case
 *
 * Creates a join request for a user to join a group.
 */
export class RequestToJoinGroupUseCase {
  execute(input: RequestToJoinGroupInput) {
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

      // Check if user is a trip participant
      const userId = UserId.unsafeCreate(input.userId);
      const participant = yield* participantPort.findByUserAndTrip(
        userId,
        group.tripId,
      );

      if (!participant) {
        return yield* Effect.fail(
          new NotTripParticipantError({
            userId: input.userId,
            tripId: TripId.toString(group.tripId),
          }),
        );
      }

      // Check if user is already in a group
      if (participant.groupId) {
        return yield* Effect.fail(
          new AlreadyInGroupError({
            userId: input.userId,
            groupId: GroupId.toString(participant.groupId),
          }),
        );
      }

      // Check for existing join request
      const existingRequest = yield* joinRequestPort.findByUserAndTrip(
        userId,
        group.tripId,
      );

      if (existingRequest) {
        if (GroupId.equals(existingRequest.groupId, group.id)) {
          return yield* Effect.fail(
            new JoinRequestAlreadyExistsError({
              userId: input.userId,
              tripId: TripId.toString(group.tripId),
            }),
          );
        } else {
          return yield* Effect.fail(
            new JoinRequestAlreadyExistsError({
              userId: input.userId,
              tripId: TripId.toString(group.tripId),
            }),
          );
        }
      }

      // Create join request
      const requestEffect = GroupJoinRequest.create({
        id: GroupJoinRequestId.generate(),
        groupId: group.id,
        tripId: group.tripId,
        userId: userId,
        status: "PENDING",
        requestedAt: new Date(),
        decidedAt: null,
        decidedBy: null,
      });

      const request = yield* requestEffect;
      const createdRequest = yield* joinRequestPort.create(request);

      return {
        id: createdRequest.id,
        groupId: createdRequest.groupId,
        tripId: createdRequest.tripId,
        userId: createdRequest.userId,
        user: {
          id: input.userId,
          firstName: "", // Will be hydrated
          lastName: "",
          email: null,
        },
        status: createdRequest.status,
        requestedAt: createdRequest.requestedAt,
        decidedAt: createdRequest.decidedAt,
        decidedBy: null,
      };
    });
  }
}
