import { Effect } from "effect";
import type { Role } from "@mirai-app/domain";
import { UserId } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import { AuthServicePortTag } from "../ports/AuthServicePort";
import type { UpdateUserResultDTO } from "../dto/UserDTOs";
import {
  UserNotFoundError,
  CannotRemoveOwnAdminError,
} from "../errors/UserErrors";

/**
 * Input for UpdateUserRoleUseCase
 */
export interface UpdateUserRoleInput {
  userId: UserId;
  role: Role;
  currentUserId: UserId;
}

/**
 * Update User Role Use Case
 *
 * Updates a user's role (admin only operation).
 */
export class UpdateUserRoleUseCase {
  execute(input: UpdateUserRoleInput) {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;
      const authService = yield* AuthServicePortTag;

      // Prevent admin from removing their own admin status
      if (
        UserId.equals(input.userId, input.currentUserId) &&
        input.role !== "ADMIN" &&
        input.role !== "MODERATOR"
      ) {
        return yield* Effect.fail(
          new CannotRemoveOwnAdminError({ userId: UserId.toString(input.userId) }),
        );
      }

      // Find user by ID
      const user = yield* userPort.findById(input.userId);

      if (!user) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: UserId.toString(input.userId) }),
        );
      }

      // Update role using domain entity method
      const updatedUser = user.withRole(input.role);

      // Save updated user
      const savedUser = yield* userPort.update(updatedUser);

      // Get auth user info for email
      const authInfo = yield* authService.getUserInfoByAuthId(
        savedUser.authUserId,
      );

      const result: UpdateUserResultDTO = {
        id: savedUser.id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: authInfo?.email ?? null,
        role: savedUser.role,
      };

      return result;
    });
  }
}
