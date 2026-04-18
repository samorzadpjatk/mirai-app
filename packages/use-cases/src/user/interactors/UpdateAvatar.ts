import { Effect } from "effect";
import { UserId } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import type { AvatarUpdateDTO } from "../dto/UserDTOs";
import { UserNotFoundError } from "../errors/UserErrors";

/**
 * Input for UpdateAvatarUseCase
 */
export interface UpdateAvatarInput {
  userId: UserId;
  hasAvatar: boolean;
}

/**
 * Update Avatar Use Case
 *
 * Updates the user's avatar status.
 */
export class UpdateAvatarUseCase {
  execute(input: UpdateAvatarInput) {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;

      // Find user by ID
      const user = yield* userPort.findById(input.userId);

      if (!user) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: UserId.toString(input.userId) }),
        );
      }

      // Update avatar status using domain entity method
      const updatedUser = user.withAvatar(input.hasAvatar);

      // Save updated user
      const savedUser = yield* userPort.update(updatedUser);

      const result: AvatarUpdateDTO = {
        hasAvatar: savedUser.hasAvatar,
      };

      return result;
    });
  }
}
