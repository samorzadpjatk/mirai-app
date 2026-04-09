import type { Result } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type { UserRepository } from "../ports/UserRepository";
import type { User } from "@repo/domain";
import { inject, injectable } from "inversify";
import { TYPES } from "@repo/frameworks/di";

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
 */
@injectable()
export class GetUserUseCase {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
  ) {}

  async execute(input: GetUserInput): Promise<Result<GetUserOutput, string>> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      return err("User not found");
    }

    return ok(this.toOutput(user));
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
