import { Effect, Data } from "effect";
import type { User, ApplicationError } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import { AuthServicePort } from "../ports/AuthServicePort";
import type { UserProfileDTO } from "../dto/UserDTOs";
import { UserNotFoundError } from "../errors/UserErrors";

/**
 * Input for GetMyProfileUseCase
 */
export interface GetMyProfileInput {
  userId: string;
}

/**
 * Get My Profile Use Case
 *
 * Retrieves the current user's profile with email from auth service.
 */
export class GetMyProfileUseCase {
  execute(
    input: GetMyProfileInput,
  ): Effect.Effect<
    UserProfileDTO | null,
    ApplicationError | UserNotFoundError,
    UserPortTag | AuthServicePort
  > {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;
      const authService = yield* AuthServicePort;

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
