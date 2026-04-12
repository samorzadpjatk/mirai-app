import { Effect } from "effect";
import { UserRepositoryTag } from "../ports/UserRepository";

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
 * Error type for DeleteUser use case
 */
export class DeleteUserNotFoundError extends Error {
  readonly _tag = "DeleteUserNotFoundError";
  constructor() {
    super("User not found");
  }
}

export class DeleteUserError extends Error {
  readonly _tag = "DeleteUserError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * DeleteUser Use Case
 *
 * Deletes a user by ID.
 * Returns error if user not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
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
  DeleteUserNotFoundError | DeleteUserError,
  UserRepositoryTag
> {
  return Effect.gen(function* () {
    const userRepo = yield* UserRepositoryTag;

    // Verify user exists before deleting
    const user = yield* userRepo.findById(input.userId);

    if (!user) {
      return yield* Effect.fail(new DeleteUserNotFoundError());
    }

    // Delete the user
    yield* userRepo.delete(input.userId);

    return {
      success: true,
      deletedUserId: input.userId,
    };
  });
}
