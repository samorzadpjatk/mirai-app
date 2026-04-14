import type { User } from "@mirai-app/domain";
import { type Result, ok, err } from "@mirai-app/domain";
import { Effect } from "effect";
import type { UserRepository } from "../ports/UserRepository";

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
 * ## Effect.gen Pattern
 *
 * This use case uses constructor injection and returns Effect.Effect<Result<T,E>, never, never>:
 *
 * ```typescript
 * const useCase = new GetUserUseCase(userRepository);
 * const result = await Effect.runPromise(useCase.execute({ userId: "123" }));
 *
 * if (result.kind === "ok") {
 *   logger.debug("User retrieved", result.value);
 * } else {
 *   logger.error("Failed to get user", result.error);
 * }
 * ```
 */
export class GetUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  execute(
    input: GetUserInput,
  ): Effect.Effect<Result<GetUserOutput, GetUserNotFoundError>, never, never> {
    return Effect.gen(this, function* () {
      const user = yield* this.userRepo.findById(input.userId);

      if (!user) {
        return err(new GetUserNotFoundError());
      }

      return ok(toOutput(user));
    });
  }
}

/**
 * Legacy function-based API for backward compatibility during migration
 * @deprecated Use GetUserUseCase class instead
 */
export function getUserUseCase(
  input: GetUserInput,
  userRepo: UserRepository,
): Effect.Effect<Result<GetUserOutput, GetUserNotFoundError>, never, never> {
  const useCase = new GetUserUseCase(userRepo);
  return useCase.execute(input);
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
