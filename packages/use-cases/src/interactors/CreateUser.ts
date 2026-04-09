import type { Result } from "@repo/domain";
import { ok, err, User, UserRole } from "@repo/domain";
import type { UserRepository } from "../ports/UserRepository";
import { inject, injectable } from "inversify";
import { TYPES } from "@repo/frameworks/di";

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
 */
@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
  ) {}

  async execute(
    input: CreateUserInput,
  ): Promise<Result<CreateUserOutput, string>> {
    // Check if user already exists
    const exists = await this.userRepository.existsByAuthUserId(
      input.authUserId,
    );
    if (exists) {
      return err("User already exists with this authUserId");
    }

    // Create domain entity
    const userResult = User.create({
      authUserId: input.authUserId,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role ?? UserRole.USER,
    });

    if (userResult.kind === "err") {
      return err(userResult.error);
    }

    // Persist user
    const saved = await this.userRepository.create(userResult.value);

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
