import type { UserRepository } from "../ports/UserRepository";
import type { User, Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";

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
 * UpdateUser Use Case
 *
 * Updates a user's profile information.
 * Returns error if user not found or validation fails.
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new UpdateUserUseCase(userRepository);
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("updateUserUseCase");
 * ```
 */
export class UpdateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: UpdateUserInput): Promise<Result<UpdateUserOutput, string>> {
    // Load user
    let user: User | null;
    try {
      user = await this.userRepository.findById(input.userId);
    } catch (_cause) {
      return err("Failed to load user");
    }

    if (!user) {
      return err("User not found");
    }

    let updatedUser: User = user;

    // Update name if provided
    if (input.firstName !== undefined || input.lastName !== undefined) {
      const nameResult = updatedUser.updateName({
        firstName: input.firstName ?? user.firstName,
        lastName: input.lastName ?? user.lastName,
      });

      if (nameResult.kind === "err") {
        return err(nameResult.error.message);
      }

      updatedUser = nameResult.value;
    }

    // Update avatar if provided
    if (input.hasAvatar !== undefined) {
      updatedUser = updatedUser.setAvatar(input.hasAvatar);
    }

    // Save updated user
    let saved: User;
    try {
      saved = await this.userRepository.update(updatedUser);
    } catch (_cause) {
      return err("Failed to update user");
    }

    return ok(this.toOutput(saved));
  }

  private toOutput(user: User): UpdateUserOutput {
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
}
