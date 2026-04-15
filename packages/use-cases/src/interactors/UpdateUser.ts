import type { User } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { UserRepositoryTag } from "../ports/UserRepository";
import { DatabaseError } from "@mirai-app/domain/ports";

/**
 * Input for UpdateUser use case
 */
export interface UpdateUserInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  hasAvatar?: boolean;
}

/**
 * Output DTO for UpdateUser use case
 */
export interface UpdateUserOutput {
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  hasAvatar: boolean;
  updatedAt: Date;
}

/**
 * Error types for UpdateUser use case
 */
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  message: string;
}> {}

export class UserUpdateError extends Data.TaggedError("UserUpdateError")<{
  message: string;
}> {}

/**
 * UpdateUser Use Case
 *
 * Updates a user's profile information.
 * Returns error if user not found or validation fails.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* updateUserUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(UserRepositoryTag, repository)
 * );
 * ```
 */
export function updateUserUseCase(
  input: UpdateUserInput,
): Effect.Effect<
  UpdateUserOutput,
  DatabaseError | UserNotFoundError | UserUpdateError,
  UserRepositoryTag
> {
  return Effect.gen(function* () {
    const userRepo = yield* UserRepositoryTag;

    // Load user
    const user = yield* userRepo.findById(input.userId);

    if (!user) {
      return yield* Effect.fail(
        new UserNotFoundError({ message: "User not found" }),
      );
    }

    let updatedUser: User = user;

    // Update name if provided
    if (input.firstName !== undefined || input.lastName !== undefined) {
      const nameResult = yield* updatedUser
        .updateName({
          firstName: input.firstName ?? user.firstName,
          lastName: input.lastName ?? user.lastName,
        })
        .pipe(
          Effect.mapError(
            (validationError) =>
              new UserUpdateError({ message: validationError.message }),
          ),
        );

      updatedUser = nameResult;
    }

    // Update avatar if provided
    if (input.hasAvatar !== undefined) {
      updatedUser = updatedUser.setAvatar(input.hasAvatar);
    }

    // Save updated user
    const saved = yield* userRepo.update(updatedUser);

    return toOutput(saved);
  });
}

function toOutput(user: User): UpdateUserOutput {
  return {
    id: user.id,
    authUserId: user.authUserId,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.getFullName(),
    role: user.role,
    hasAvatar: user.hasAvatar,
    updatedAt: user.updatedAt,
  };
}
