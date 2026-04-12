import type { User } from "@mirai-app/domain";
import { Effect } from "effect";
import { UserRepositoryTag } from "../ports/UserRepository";

/**
 * Input for GetUser use case
 */
export interface GetUserInput {
  userId: string;
}

/**
 * Output DTO for GetUser use case
 */
export interface GetUserOutput {
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  hasAvatar: boolean;
  createdAt: Date;
  lastSeenOn: Date | null;
}

/**
 * Error type for GetUser use case
 */
export class GetUserNotFoundError extends Error {
  readonly _tag = "GetUserNotFoundError";
  constructor() {
    super("User not found");
  }
}

/**
 * GetUser Use Case
 *
 * Retrieves a user by ID.
 * Returns error if user not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* getUserUseCase({ userId: "123" });
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
export function getUserUseCase(
  input: GetUserInput,
): Effect.Effect<GetUserOutput, GetUserNotFoundError, UserRepositoryTag> {
  return Effect.gen(function* () {
    const userRepo = yield* UserRepositoryTag;

    const user = yield* userRepo.findById(input.userId);

    if (!user) {
      return yield* Effect.fail(new GetUserNotFoundError());
    }

    return toOutput(user);
  });
}

function toOutput(user: User): GetUserOutput {
  return {
    id: user.id,
    authUserId: user.authUserId,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.getFullName(),
    role: user.role,
    hasAvatar: user.hasAvatar,
    createdAt: user.createdAt,
    lastSeenOn: user.lastSeenOn,
  };
}
