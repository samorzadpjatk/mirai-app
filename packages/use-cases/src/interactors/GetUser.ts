import { Effect } from "effect";
import type { UserRepository } from "../ports/UserRepository";
import type { User } from "@mirai-app/domain";
import {
  UseCaseNotFoundError,
  UseCaseRepositoryError,
  type UseCaseError,
} from "../errors";

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
 * GetUser Use Case
 *
 * Retrieves a user by ID.
 * Returns error if user not found.
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new GetUserUseCase(userRepository);
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("getUserUseCase");
 * ```
 */
export class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}

  execute(input: GetUserInput): Effect.Effect<GetUserOutput, UseCaseError> {
    const userRepository = this.userRepository;
    const toOutput = this.toOutput.bind(this);

    return Effect.gen(function* () {
      const user = yield* Effect.tryPromise({
        try: () => userRepository.findById(input.userId),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "GetUser.findById",
            message: "Failed to load user",
            cause,
          }),
      });

      if (!user) {
        return yield* Effect.fail(
          new UseCaseNotFoundError({
            entity: "User",
            message: "User not found",
          }),
        );
      }

      return toOutput(user);
    });
  }

  private toOutput(user: User): GetUserOutput {
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
}
