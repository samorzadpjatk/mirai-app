import { User, UserRole } from "@mirai-app/domain";
import type { UserRepository } from "../ports/UserRepository";
import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";

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

  async execute(input: CreateUserInput): Promise<Result<CreateUserOutput, string>> {
    // Check if user already exists
    let exists: boolean;
    try {
      exists = await this.userRepository.existsByAuthUserId(input.authUserId);
    } catch (_cause) {
      return err("Failed to check user existence");
    }

    if (exists) {
      return err("User with this auth ID already exists");
    }

    // Create domain entity
    const userResult = User.create({
      authUserId: input.authUserId,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role ?? UserRole.USER,
    });

    if (userResult.kind === "err") {
      return err("User name is required");
    }

    // Save to repository
    let saved: User;
    try {
      saved = await this.userRepository.create(userResult.value);
    } catch (_cause) {
      return err("Failed to create user");
    }

    return ok(this.toOutput(saved));
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
