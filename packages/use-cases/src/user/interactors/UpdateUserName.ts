import { Effect } from "effect";
import type { ApplicationError, ValidationError } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import { AuthServicePort } from "../ports/AuthServicePort";
import type { UpdateUserResultDTO } from "../dto/UserDTOs";
import { UserNotFoundError } from "../errors/UserErrors";

/**
 * Input for UpdateUserNameUseCase
 */
export interface UpdateUserNameInput {
  userId: string;
  firstName: string;
  lastName: string;
}

/**
 * Update User Name Use Case
 *
 * Updates a user's name (admin only operation).
 */
export class UpdateUserNameUseCase {
  execute(
    input: UpdateUserNameInput,
  ): Effect.Effect<
    UpdateUserResultDTO,
    ApplicationError | UserNotFoundError | ValidationError,
    UserPortTag | AuthServicePort
  > {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;
      const authService = yield* AuthServicePort;

      // Find user by ID
      const user = yield* userPort.findById(input.userId);

      if (!user) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: input.userId }),
        );
      }

      // Update profile using domain entity method
      const updatedUserEffect = user.withProfile({
        firstName: input.firstName,
        lastName: input.lastName,
      });

      const updatedUser = yield* updatedUserEffect;

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
