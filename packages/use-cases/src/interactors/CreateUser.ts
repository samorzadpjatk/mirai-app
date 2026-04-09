import { Effect } from "effect";
import { User, UserRole } from "@mirai-app/domain";
import type { UserRepository } from "../ports/UserRepository";
import {
  UseCaseConflictError,
  UseCaseRepositoryError,
  UseCaseValidationError,
  type UseCaseError,
} from "../errors";

/**
 * Input for CreateUser use case
 */
export interface CreateUserInput {
  authUserId: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

/**
 * Output DTO for CreateUser use case
 */
export interface CreateUserOutput {
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  hasAvatar: boolean;
  createdAt: Date;
}

/**
 * CreateUser Use Case
 *
 * Creates a new user in the system.
 * Returns error if user with same authUserId already exists.
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new CreateUserUseCase(userRepository);
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("createUserUseCase");
 * ```
 */
export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  execute(
    input: CreateUserInput,
  ): Effect.Effect<CreateUserOutput, UseCaseError> {
    const userRepository = this.userRepository;
    const toOutput = this.toOutput.bind(this);

    return Effect.gen(function* () {
      const exists = yield* Effect.tryPromise({
        try: () => userRepository.existsByAuthUserId(input.authUserId),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "CreateUser.existsByAuthUserId",
            message: "Failed to check user uniqueness",
            cause,
          }),
      });

      if (exists) {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "User",
            message: "User already exists with this authUserId",
          }),
        );
      }

      const userResult = User.create({
        authUserId: input.authUserId,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role ?? UserRole.USER,
      });

      if (userResult.kind === "err") {
        return yield* Effect.fail(
          new UseCaseValidationError({
            field: "user",
            message: userResult.error,
          }),
        );
      }

      const saved = yield* Effect.tryPromise({
        try: () => userRepository.create(userResult.value),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "CreateUser.create",
            message: "Failed to create user",
            cause,
          }),
      });

      return toOutput(saved);
    });
  }

  private toOutput(user: User): CreateUserOutput {
    return {
      id: user.id,
      authUserId: user.authUserId,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.getFullName(),
      role: user.role,
      hasAvatar: user.hasAvatar,
      createdAt: user.createdAt,
    };
  }
}
