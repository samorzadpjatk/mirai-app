import { GroupStatus, DatabaseError } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { GroupGatewayTag } from "../ports/gateway";
import type { GroupDTO } from "../dto";

/**
 * Input for UpdateGroup use case
 */
export interface UpdateGroupInput {
  groupId: string;
  name?: string;
  description?: string | null;
  image?: string | null;
  organizerId?: string;
  code?: string;
}

/**
 * Output DTO for UpdateGroup use case
 */
export interface UpdateGroupOutput {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  image: string | null;
  organizerId: string;
  code: string;
  coins: number;
  status: string;
  updatedAt: Date;
  isActive: boolean;
  summary: string;
}

/**
 * Error types for UpdateGroup use case
 */
export class UpdateGroupNotFoundError extends Data.TaggedError(
  "UpdateGroupNotFoundError",
)<{}> {}

export class UpdateGroupDeletedError extends Data.TaggedError(
  "UpdateGroupDeletedError",
)<{}> {}

export class UpdateGroupValidationError extends Data.TaggedError(
  "UpdateGroupValidationError",
)<{ message: string }> {}

/**
 * UpdateGroup Use Case
 *
 * Updates a group's details.
 * Returns error if group not found, is deleted, or validation fails.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* updateGroupUseCase({ groupId: "123", name: "New Name" });
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
export function updateGroupUseCase(
  input: UpdateGroupInput,
): Effect.Effect<
  UpdateGroupOutput,
  | DatabaseError
  | UpdateGroupNotFoundError
  | UpdateGroupDeletedError
  | UpdateGroupValidationError,
  GroupGatewayTag
> {
  return Effect.gen(function* () {
    const groupRepo = yield* GroupGatewayTag;

    // Load group
    const group = yield* groupRepo.findById(input.groupId);

    if (!group) {
      return yield* Effect.fail(new UpdateGroupNotFoundError({}));
    }

    if (group.status === GroupStatus.DELETED) {
      return yield* Effect.fail(new UpdateGroupDeletedError({}));
    }

    // Validate name if provided
    if (input.name !== undefined && input.name.trim().length === 0) {
      return yield* Effect.fail(
        new UpdateGroupValidationError({
          message: "Group name cannot be empty",
        }),
      );
    }

    // Validate organizerId if provided
    if (
      input.organizerId !== undefined &&
      input.organizerId.trim().length === 0
    ) {
      return yield* Effect.fail(
        new UpdateGroupValidationError({
          message: "Organizer ID cannot be empty",
        }),
      );
    }

    // Build updated DTO
    const updatedGroup: GroupDTO = {
      ...group,
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.image !== undefined && { imageUrl: input.image }),
      ...(input.organizerId !== undefined && {
        createdById: input.organizerId,
      }),
      updatedAt: new Date(),
    };

    // Save updated group
    const saved = yield* groupRepo.update(updatedGroup);

    return toOutput(saved);
  });
}

function toOutput(group: GroupDTO): UpdateGroupOutput {
  return {
    id: group.id,
    tripId: group.tripId,
    name: group.name,
    description: group.description,
    image: group.imageUrl,
    organizerId: group.createdById,
    code: group.code,
    coins: group.coins,
    status: group.status,
    updatedAt: group.updatedAt,
    isActive: group.status === GroupStatus.ACTIVE,
    summary: `${group.name} (${group.coins} coins)`,
  };
}
