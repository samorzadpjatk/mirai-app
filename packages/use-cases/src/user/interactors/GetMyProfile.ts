import { Effect } from "effect";
import type { User } from "@mirai-app/domain";
import { UserId } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import { AuthServicePortTag } from "../ports/AuthServicePort";
import type { UserProfileDTO } from "../dto/UserDTOs";

/**
 * Input for GetMyProfileUseCase
 */
export interface GetMyProfileInput {
  userId: UserId;
}

/**
 * Get My Profile Use Case
 *
 * Retrieves the current user's profile with email from auth service.
 */
export class GetMyProfileUseCase {
  execute(input: GetMyProfileInput) {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;
      const authService = yield* AuthServicePortTag;

      // Find user by ID
      const user = yield* userPort.findById(input.userId);

      if (!user) {
        return null;
      }

      // Get auth user info for email
      const authInfo = yield* authService.getUserInfoByAuthId(user.authUserId);

      const result: UserProfileDTO = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: authInfo?.email ?? null,
        role: user.role,
        hasAvatar: user.hasAvatar,
      };

      return result;
    });
  }
}
