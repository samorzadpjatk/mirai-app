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
 * Input for AssignUserToGroup use case
 */
export interface AssignUserToGroupInput {
  groupId: GroupId;
  userId: UserId;
}

/**
 * Output DTO for AssignUserToGroup use case
 */
export interface AssignUserToGroupOutput {
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
 * Error types for AssignUserToGroup use case
 */
export class GroupNotFoundError extends Data.TaggedError("GroupNotFoundError")<{
  groupId: string;
}> {}

export class AssignUserToGroupUserNotFoundError extends Data.TaggedError(
  "AssignUserToGroupUserNotFoundError",
)<{
  userId: string;
}> {}

export class ParticipantNotFoundError extends Data.TaggedError(
  "ParticipantNotFoundError",
)<{
  userId: string;
  tripId: string;
}> {}

export type AssignUserToGroupError =
  | DatabaseError
  | GroupNotFoundError
  | AssignUserToGroupUserNotFoundError
  | ParticipantNotFoundError;

/**
 * AssignUserToGroup Use Case
 *
 * Assigns a user to a group. The user must already be a participant in the trip
 * that the group belongs to. Idempotent - if the user is already assigned to
 * the group, returns success without making changes.
 *
 * ## Effect.gen Pattern
 *
 * This use case uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* assignUserToGroupUseCase({
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
export function assignUserToGroupUseCase(
  input: AssignUserToGroupInput,
): Effect.Effect<
  AssignUserToGroupOutput,
  AssignUserToGroupError,
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

    // Idempotency check: if already assigned to this group, return the group
    if (participant.groupId === input.groupId) {
      return toOutput(group);
    }

    // Assign the user to the group
    yield* groupRepo.assignUserToGroup(input.userId, input.groupId);

    // Return the updated group
    return toOutput(group);
  });
}

function toOutput(group: Group): AssignUserToGroupOutput {
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
