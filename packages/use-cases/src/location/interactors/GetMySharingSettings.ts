import { Effect } from "effect";
import { LocationPort } from "../ports/LocationPort";
import { UserId } from "@mirai-app/domain";
import type { LocationSharingSettingsDTO } from "../dto/LocationDTOs";
import type { ApplicationError } from "@mirai-app/domain";

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
  execute(
    input: GetMySharingSettingsInput,
  ): Effect.Effect<LocationSharingSettingsDTO, ApplicationError, LocationPort> {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPort;

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
