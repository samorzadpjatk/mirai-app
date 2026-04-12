import {
  Group,
  StateTransitionError,
  ValidationError,
} from "@mirai-app/domain";
import { Effect } from "effect";
import { GroupRepositoryTag } from "../ports/GroupRepository";

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
export class UpdateGroupNotFoundError extends Error {
  readonly _tag = "UpdateGroupNotFoundError";
  constructor() {
    super("Group not found");
  }
}

export class UpdateGroupDeletedError extends Error {
  readonly _tag = "UpdateGroupDeletedError";
  constructor() {
    super("Cannot update a deleted group");
  }
}

export class UpdateGroupValidationError extends Error {
  readonly _tag = "UpdateGroupValidationError";
  constructor(message: string) {
    super(message);
  }
}

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
      return yield* Effect.fail(new UpdateGroupNotFoundError());
    }

    if (group.isDeleted()) {
      return yield* Effect.fail(new UpdateGroupDeletedError());
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
            return new UpdateGroupValidationError(error.message);
          }),
        );
    }

    // Update organizer if provided
    if (input.organizerId !== undefined) {
      updatedGroup = yield* updatedGroup
        .changeOrganizer(input.organizerId)
        .pipe(
          Effect.mapError((error: ValidationError) => {
            return new UpdateGroupValidationError(error.message);
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
