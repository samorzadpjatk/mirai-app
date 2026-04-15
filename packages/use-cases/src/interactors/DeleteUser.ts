import { Data, Effect } from "effect";
import { UserRepositoryTag } from "../ports/UserRepository";
import { DatabaseError } from "@mirai-app/domain/ports";

/**
 * Input for DeleteUser use case
 */
export interface DeleteUserInput {
  userId: string;
}

/**
 * Output DTO for DeleteUser use case
 */
export interface DeleteUserOutput {
  success: boolean;
  deletedUserId: string;
}

/**
 * Error types for DeleteUser use case - uses Data.TaggedError for Effect integration
 */
export class DeleteUserNotFoundError extends Data.TaggedError(
  "DeleteUserNotFoundError",
)<{ userId: string }> {}

export class DeleteUserError extends Data.TaggedError("DeleteUserError")<{
  message: string;
}> {}

/**
 * DeleteUser Use Case
 *
 * Deletes a user by ID.
 * Fails with DeleteUserNotFoundError if user not found.
 *
 * ## Effect.gen Pattern (Native)
 *
 * This use case uses Context.Tag for dependency injection and returns native Effect.Effect<T, E, R>:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* deleteUserUseCase({ userId: "123" });
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(UserRepositoryTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function deleteUserUseCase(
  input: DeleteUserInput,
): Effect.Effect<
  DeleteUserOutput,
  DatabaseError | DeleteUserNotFoundError | DeleteUserError,
  UserRepositoryTag
> {
  return Effect.gen(function* () {
    const userRepo = yield* UserRepositoryTag;

    // Verify user exists before deleting
    const user = yield* userRepo.findById(input.userId);

    if (!user) {
      return yield* Effect.fail(
        new DeleteUserNotFoundError({ userId: input.userId }),
      );
    }

    // Delete the user
    yield* userRepo.delete(input.userId);

    return {
      success: true,
      deletedUserId: input.userId,
    };
  });
}
