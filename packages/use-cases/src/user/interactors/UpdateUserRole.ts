import { Effect } from "effect";
import type { ApplicationError, Role } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import { AuthServicePort } from "../ports/AuthServicePort";
import type { UpdateUserResultDTO } from "../dto/UserDTOs";
import {
  UserNotFoundError,
  CannotRemoveOwnAdminError,
} from "../errors/UserErrors";

/**
 * Input for UpdateUserRoleUseCase
 */
export interface UpdateUserRoleInput {
  userId: string;
  role: Role;
  currentUserId: string;
}

/**
 * Update User Role Use Case
 *
 * Updates a user's role (admin only operation).
 */
export class UpdateUserRoleUseCase {
  execute(
    input: UpdateUserRoleInput,
  ): Effect.Effect<
    UpdateUserResultDTO,
    ApplicationError | UserNotFoundError | CannotRemoveOwnAdminError,
    UserPortTag | AuthServicePort
  > {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;
      const authService = yield* AuthServicePort;

      // Prevent admin from removing their own admin status
      if (
        input.userId === input.currentUserId &&
        input.role !== "ADMIN" &&
        input.role !== "MODERATOR"
      ) {
        return yield* Effect.fail(
          new CannotRemoveOwnAdminError({ userId: input.userId }),
        );
      }

      // Find user by ID
      const user = yield* userPort.findById(input.userId);

      if (!user) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: input.userId }),
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
