import {
  Group,
  TripParticipant,
  type GroupId,
  type UserId,
} from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { GroupGatewayTag } from "../ports/gateway";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Input for RemoveUserFromGroup use case
 */
export interface RemoveUserFromGroupInput {
  groupId: GroupId;
  userId: UserId;
}

/**
 * Output DTO for RemoveUserFromGroup use case
 */
export interface RemoveUserFromGroupOutput {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  image: string | null;
  organizerId: string;
  code: string;
  coins: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  summary: string;
}

/**
 * Error types for RemoveUserFromGroup use case
 */
export class GroupNotFoundError extends Data.TaggedError("GroupNotFoundError")<{
  groupId: string;
}> {}

export class NotGroupMemberError extends Data.TaggedError(
  "NotGroupMemberError",
)<{
  userId: string;
  groupId: string;
}> {}

export class ParticipantNotFoundError extends Data.TaggedError(
  "ParticipantNotFoundError",
)<{
  userId: string;
  tripId: string;
}> {}

export type RemoveUserFromGroupError =
  | DatabaseError
  | GroupNotFoundError
  | NotGroupMemberError
  | ParticipantNotFoundError;

/**
 * RemoveUserFromGroup Use Case
 *
 * Removes a user from a group. The user must be a participant in the trip
 * that the group belongs to, and must currently be assigned to the group.
 *
 * ## Effect.gen Pattern
 *
 * This use case uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* removeUserFromGroupUseCase({
 *     groupId: "group-123",
 *     userId: "user-456"
 *   });
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(GroupGatewayTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function removeUserFromGroupUseCase(
  input: RemoveUserFromGroupInput,
): Effect.Effect<
  RemoveUserFromGroupOutput,
  RemoveUserFromGroupError,
  GroupGatewayTag
> {
  return Effect.gen(function* () {
    const groupRepo = yield* GroupGatewayTag;

    // Find the group to verify it exists and get tripId
    const group = yield* groupRepo.findById(input.groupId);

    if (!group) {
      return yield* Effect.fail(
        new GroupNotFoundError({ groupId: input.groupId }),
      );
    }

    // Find the trip participant for this user in the group's trip
    const participant = yield* groupRepo.findParticipantByUserIdAndTripId(
      input.userId,
      group.tripId,
    );

    if (!participant) {
      return yield* Effect.fail(
        new ParticipantNotFoundError({
          userId: input.userId,
          tripId: group.tripId,
        }),
      );
    }

    // Check if the user is actually assigned to this group
    if (participant.groupId !== input.groupId) {
      return yield* Effect.fail(
        new NotGroupMemberError({
          userId: input.userId,
          groupId: input.groupId,
        }),
      );
    }

    // Remove the user from the group
    yield* groupRepo.removeUserFromGroup(input.userId, input.groupId);

    // Return the updated group
    return toOutput(group);
  });
}

function toOutput(group: Group): RemoveUserFromGroupOutput {
  return {
    id: group.id,
    tripId: group.tripId,
    name: group.name,
    description: group.description,
    image: group.image,
    organizerId: group.organizerId,
    code: group.code,
    coins: group.coins,
    status: group.status,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    isActive: group.isActive(),
    summary: group.getSummary(),
  };
}
