import {
  Group,
  StateTransitionError,
  ValidationError,
} from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { GroupRepositoryTag } from "../ports/GroupRepository";
import { DatabaseError } from "@mirai-app/domain/ports";

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
 *   Effect.provideService(GroupRepositoryTag, repository)
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
  GroupRepositoryTag
> {
  return Effect.gen(function* () {
    const groupRepo = yield* GroupRepositoryTag;

    // Load group
    const group = yield* groupRepo.findById(input.groupId);

    if (!group) {
      return yield* Effect.fail(new UpdateGroupNotFoundError({}));
    }

    if (group.isDeleted()) {
      return yield* Effect.fail(new UpdateGroupDeletedError({}));
    }

    let updatedGroup: Group = group;

    // Update details if provided
    if (
      input.name !== undefined ||
      input.description !== undefined ||
      input.image !== undefined
    ) {
      updatedGroup = yield* group
        .updateDetails({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.image !== undefined && { image: input.image }),
        })
        .pipe(
          Effect.mapError((error: ValidationError | StateTransitionError) => {
            return new UpdateGroupValidationError({ message: error.message });
          }),
        );
    }

    // Update organizer if provided
    if (input.organizerId !== undefined) {
      updatedGroup = yield* updatedGroup
        .changeOrganizer(input.organizerId)
        .pipe(
          Effect.mapError((error: ValidationError) => {
            return new UpdateGroupValidationError({ message: error.message });
          }),
        );
    }

    // Save updated group
    const saved = yield* groupRepo.update(updatedGroup);

    return toOutput(saved);
  });
}

function toOutput(group: Group): UpdateGroupOutput {
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
    updatedAt: group.updatedAt,
    isActive: group.isActive(),
    summary: group.getSummary(),
  };
}
