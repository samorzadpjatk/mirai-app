import { Group } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { GroupGatewayTag } from "../ports/gateway";
import { DatabaseError } from "@mirai-app/domain";

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
 * Error types for DeleteGroup use case - uses Data.TaggedError for Effect integration
 */
export class DeleteGroupNotFoundError extends Data.TaggedError(
  "DeleteGroupNotFoundError",
)<{ groupId: string }> {}

export class DeleteGroupError extends Data.TaggedError("DeleteGroupError")<{
  message: string;
}> {}

/**
 * DeleteGroup Use Case
 *
 * Deletes a group by ID.
 * Fails with DeleteGroupNotFoundError if group not found.
 *
 * ## Effect.gen Pattern (Native)
 *
 * This use case uses Context.Tag for dependency injection and returns native Effect.Effect<T, E, R>:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* deleteGroupUseCase({ groupId: "123" });
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
export function deleteGroupUseCase(
  input: DeleteGroupInput,
): Effect.Effect<
  DeleteGroupOutput,
  DatabaseError | DeleteGroupNotFoundError | DeleteGroupError,
  GroupGatewayTag
> {
  return Effect.gen(function* () {
    const groupRepo = yield* GroupGatewayTag;

    // Verify group exists before deleting
    const group = yield* groupRepo.findById(input.groupId);

    if (!group) {
      return yield* Effect.fail(
        new DeleteGroupNotFoundError({ groupId: input.groupId }),
      );
    }

    // Delete the group
    yield* groupRepo.delete(input.groupId);

    return {
      success: true,
      deletedGroupId: input.groupId,
    };
  });
}
