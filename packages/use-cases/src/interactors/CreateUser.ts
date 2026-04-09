import { User, UserRole } from "@mirai-app/domain";
import type { UserRepository } from "../ports/UserRepository";
import {
  UseCaseConflictError,
  UseCaseRepositoryError,
  UseCaseValidationError,
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

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    // Check if user already exists
    let exists: boolean;
    try {
      exists = await this.userRepository.existsByAuthUserId(input.authUserId);
    } catch (cause) {
      throw new UseCaseRepositoryError({
        operation: "CreateUser.existsByAuthUserId",
        message: "Failed to check user uniqueness",
        cause,
      });
    }

    if (exists) {
      throw new UseCaseConflictError({
        entity: "User",
        message: "User already exists with this authUserId",
      });
    }

    // Create domain entity
    const userResult = User.create({
      authUserId: input.authUserId,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role ?? UserRole.USER,
    });

    if (userResult.kind === "err") {
      throw new UseCaseValidationError({
        field: "user",
        message: userResult.error,
      });
    }

    // Save to repository
    let saved: User;
    try {
      saved = await this.userRepository.create(userResult.value);
    } catch (cause) {
      throw new UseCaseRepositoryError({
        operation: "CreateUser.create",
        message: "Failed to create user",
        cause,
      });
    }

    return this.toOutput(saved);
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
