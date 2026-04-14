import type { User } from "@mirai-app/domain";
import { type Result, ok, err } from "@mirai-app/domain";
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
 * ## Async/Await Pattern (Migrated from Effect)
 *
 * This use case uses constructor injection and returns Promise<Result<T,E>>:
 *
 * ```typescript
 * const useCase = new GetUserUseCase(userRepository);
 * const result = await useCase.execute({ userId: "123" });
 *
 * if (result.kind === "ok") {
 *   console.log(result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export class GetUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(
    input: GetUserInput,
  ): Promise<Result<GetUserOutput, GetUserNotFoundError>> {
    const user = await this.userRepo.findById(input.userId);

    if (!user) {
      return err(new GetUserNotFoundError());
    }

    return ok(toOutput(user));
  }
}

/**
 * Legacy function-based API for backward compatibility during migration
 * @deprecated Use GetUserUseCase class instead
 */
export async function getUserUseCase(
  input: GetUserInput,
  userRepo: UserRepository,
): Promise<Result<GetUserOutput, GetUserNotFoundError>> {
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
