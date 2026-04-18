import { Effect } from "effect";
import { LocationPortTag } from "../ports/LocationPort";
import { UserId } from "@mirai-app/domain";
import type { LocationSharingSettingsDTO } from "../dto/LocationDTOs";

/**
 * Input for GetMySharingSettingsUseCase
 */
export interface GetMySharingSettingsInput {
  userId: string;
}

/**
 * Get My Sharing Settings Use Case
 *
 * Retrieves the user's location sharing settings.
 */
export class GetMySharingSettingsUseCase {
  execute(input: GetMySharingSettingsInput) {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPortTag;

      const userId = UserId.unsafeCreate(input.userId);
      const location = yield* locationPort.findByUserId(userId);

      if (!location) {
        return {
          isSharingLocation: false,
          usersToShareWith: [],
        };
      }

      // Note: User details (names, avatars) will be hydrated by the adapter layer
      return {
        isSharingLocation: location.isSharingLocation,
        usersToShareWith: [], // Will be populated by adapter
      };
    });
  }
}
