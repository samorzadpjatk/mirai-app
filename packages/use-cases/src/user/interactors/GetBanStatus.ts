import { Effect } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { AuthServicePort } from "../ports/AuthServicePort";
import type { BanStatusDTO } from "../dto/UserDTOs";

/**
 * Input for GetBanStatusUseCase
 */
export interface GetBanStatusInput {
  accessToken: string | null;
}

/**
 * Get Ban Status Use Case
 *
 * Checks if the current user is banned based on their access token.
 */
export class GetBanStatusUseCase {
  execute(
    input: GetBanStatusInput,
  ): Effect.Effect<BanStatusDTO, ApplicationError, AuthServicePort> {
    return Effect.gen(function* () {
      const authService = yield* AuthServicePort;

      // If no access token, user is not banned
      if (!input.accessToken) {
        return {
          banned: false,
          bannedUntil: null,
          reason: null,
        };
      }

      // Get ban status from auth service
      const banStatus = yield* authService.getCurrentUserBanStatus(
        input.accessToken,
      );

      return {
        banned: banStatus.banned,
        bannedUntil: banStatus.bannedUntil,
        reason: banStatus.reason,
      };
    });
  }
}
