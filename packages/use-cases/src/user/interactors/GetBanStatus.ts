import { Effect } from "effect";
import type { IPortError } from "@mirai-app/domain";
import { AuthServicePortTag } from "../ports/AuthServicePort";
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
  execute(input: GetBanStatusInput) {
    return Effect.gen(function* () {
      const authService = yield* AuthServicePortTag;

      // If no access token, user is not banned and doesn't exist in auth system
      if (!input.accessToken) {
        return {
          banned: false,
          bannedUntil: null,
          reason: null,
          exists: false,
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
        exists: true,
      };
    });
  }
}
