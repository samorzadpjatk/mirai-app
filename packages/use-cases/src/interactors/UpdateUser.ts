import type { Result } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type { UserRepository } from "../ports/UserRepository";
import type { User } from "@repo/domain";
import { inject, injectable } from "inversify";
import { TYPES } from "@repo/frameworks/di";

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
 */
@injectable()
export class UpdateUserUseCase {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
  ) {}

  async execute(
    input: UpdateUserInput,
  ): Promise<Result<UpdateUserOutput, string>> {
    // Find existing user
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      return err("User not found");
    }

    // Apply updates
    let updatedUser: User = user;

    // Update name if provided
    if (input.firstName !== undefined || input.lastName !== undefined) {
      const nameResult = updatedUser.updateName({
        firstName: input.firstName ?? user.firstName,
        lastName: input.lastName ?? user.lastName,
      });

      if (nameResult.kind === "err") {
        return err(nameResult.error);
      }

      updatedUser = nameResult.value;
    }

    // Update avatar status if provided
    if (input.hasAvatar !== undefined) {
      updatedUser = updatedUser.setAvatar(input.hasAvatar);
    }

    // Persist changes
    const saved = await this.userRepository.update(updatedUser);

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
