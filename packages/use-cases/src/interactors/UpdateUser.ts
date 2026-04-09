import type { UserRepository } from "../ports/UserRepository";
import type { User } from "@mirai-app/domain";
import { AppError } from "../errors";

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

  async execute(input: UpdateUserInput): Promise<UpdateUserOutput> {
    // Load user
    let user: User | null;
    try {
      user = await this.userRepository.findById(input.userId);
    } catch (cause) {
      throw AppError.repository({
        operation: "UpdateUser.findById",
        message: "Failed to load user",
        cause,
      });
    }

    if (!user) {
      throw AppError.notFound({
        entity: "User",
        message: "User not found",
      });
    }

    let updatedUser: User = user;

    // Update name if provided
    if (input.firstName !== undefined || input.lastName !== undefined) {
      const nameResult = updatedUser.updateName({
        firstName: input.firstName ?? user.firstName,
        lastName: input.lastName ?? user.lastName,
      });

      if (nameResult.kind === "err") {
        throw AppError.validation({
          field: "name",
          message: nameResult.error,
        });
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
    } catch (cause) {
      throw AppError.repository({
        operation: "UpdateUser.update",
        message: "Failed to update user",
        cause,
      });
    }

    return this.toOutput(saved);
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
