import { Effect } from "effect";
import { UserId } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import { AuthServicePortTag } from "../ports/AuthServicePort";
import type { UpdateUserResultDTO } from "../dto/UserDTOs";

/**
 * Input for GetUserByIdUseCase
 */
export interface GetUserByIdInput {
  userId: UserId;
}

/**
 * Get User By ID Admin Use Case
 *
 * Retrieves a user by their ID with email from auth service (for moderators/admins).
 */
export class GetUserByIdAdminUseCase {
  execute(input: GetUserByIdInput) {
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

      const result: UpdateUserResultDTO = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: authInfo?.email ?? null,
        role: user.role,
      };

      return result;
    });
  }
}
