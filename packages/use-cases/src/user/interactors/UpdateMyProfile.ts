import { Effect } from "effect";
import { UserId } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import { AuthServicePortTag } from "../ports/AuthServicePort";
import type { UserProfileDTO } from "../dto/UserDTOs";
import { UserNotFoundError } from "../errors/UserErrors";

/**
 * Input for UpdateMyProfileUseCase
 */
export interface UpdateMyProfileInput {
  userId: UserId;
  firstName: string;
  lastName: string;
}

/**
 * Update My Profile Use Case
 *
 * Updates the current user's profile (first/last name).
 */
export class UpdateMyProfileUseCase {
  execute(input: UpdateMyProfileInput) {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;
      const authService = yield* AuthServicePortTag;

      // Find user by ID
      const user = yield* userPort.findById(input.userId);

      if (!user) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: UserId.toString(input.userId) }),
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
      const authInfo = yield* authService.getUserInfoByAuthId(user.authUserId);

      const result: UserProfileDTO = {
        id: savedUser.id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: authInfo?.email ?? null,
        role: savedUser.role,
        hasAvatar: savedUser.hasAvatar,
      };

      return result;
    });
  }
}
