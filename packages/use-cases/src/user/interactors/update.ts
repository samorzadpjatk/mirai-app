import { Data, Effect } from "effect";
import { UserGatewayTag } from "../ports/gateway";
import { DatabaseError } from "@mirai-app/domain";
import type { UserDTO } from "../dto";

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
 *   Effect.provideService(UserGatewayTag, repository)
 * );
 * ```
 */
export function updateUserUseCase(
  input: UpdateUserInput,
): Effect.Effect<
  UpdateUserOutput,
  DatabaseError | UserNotFoundError | UserUpdateError,
  UserGatewayTag
> {
  return Effect.gen(function* () {
    const userRepo = yield* UserGatewayTag;

    // Load user
    const user = yield* userRepo.findById(input.userId);

    if (!user) {
      return yield* Effect.fail(
        new UserNotFoundError({ message: "User not found" }),
      );
    }

    // Update user fields directly on DTO
    const updatedUser: UserDTO = {
      ...user,
      firstName: input.firstName ?? user.firstName,
      lastName: input.lastName ?? user.lastName,
      updatedAt: new Date(),
    };

    // Save updated user
    const saved = yield* userRepo.update(updatedUser);

    return toOutput(saved);
  });
}

function toOutput(user: UserDTO): UpdateUserOutput {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return {
    id: user.id,
    authUserId: user.authUserId,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    fullName: fullName || user.nickname || "",
    role: user.role,
    hasAvatar: !!user.avatarUrl,
    updatedAt: user.updatedAt,
  };
}
