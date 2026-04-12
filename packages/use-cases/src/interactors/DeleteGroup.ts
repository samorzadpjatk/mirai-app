import { Group } from "@mirai-app/domain";
import { Effect } from "effect";
import { GroupRepositoryTag } from "../ports/GroupRepository";

/**
 * Input for DeleteGroup use case
 */
export interface DeleteGroupInput {
  groupId: string;
}

/**
 * Output DTO for DeleteGroup use case
 */
export interface DeleteGroupOutput {
  success: boolean;
  deletedGroupId: string;
}

/**
 * Error type for DeleteGroup use case
 */
export class DeleteGroupNotFoundError extends Error {
  readonly _tag = "DeleteGroupNotFoundError";
  constructor() {
    super("Group not found");
  }
}

export class DeleteGroupError extends Error {
  readonly _tag = "DeleteGroupError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * DeleteGroup Use Case
 *
 * Deletes a group by ID.
 * Returns error if group not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* deleteGroupUseCase({ groupId: "123" });
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
export function deleteGroupUseCase(
  input: DeleteGroupInput,
): Effect.Effect<
  DeleteGroupOutput,
  DeleteGroupNotFoundError | DeleteGroupError,
  GroupRepositoryTag
> {
  return Effect.gen(function* () {
    const groupRepo = yield* GroupRepositoryTag;

    // Verify group exists before deleting
    const group = yield* groupRepo.findById(input.groupId);

    if (!group) {
      return yield* Effect.fail(new DeleteGroupNotFoundError());
    }

    // Delete the group
    yield* groupRepo.delete(input.groupId);

    return {
      success: true,
      deletedGroupId: input.groupId,
    };
  });
}
