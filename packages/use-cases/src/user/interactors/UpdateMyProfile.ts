import { Effect } from "effect";
import type { ApplicationError, ValidationError } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import type { UserProfileDTO } from "../dto/UserDTOs";
import { UserNotFoundError } from "../errors/UserErrors";

/**
 * Input for UpdateMyProfileUseCase
 */
export interface UpdateMyProfileInput {
  userId: string;
  firstName: string;
  lastName: string;
}

/**
 * Update My Profile Use Case
 *
 * Updates the current user's profile (first/last name).
 */
export class UpdateMyProfileUseCase {
  execute(
    input: UpdateMyProfileInput,
  ): Effect.Effect<
    UserProfileDTO,
    ApplicationError | UserNotFoundError | ValidationError,
    UserPortTag
  > {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;

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

      const result: UserProfileDTO = {
        id: savedUser.id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: null, // Will be hydrated by adapter layer
        role: savedUser.role,
        hasAvatar: savedUser.hasAvatar,
      };

      return result;
    });
  }
}
