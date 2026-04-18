import { Effect } from "effect";
import type { IPortError } from "@mirai-app/domain";
import { AuthServicePortTag } from "../ports/AuthServicePort";
import type { BanStatusDTO } from "../dto/UserDTOs";

/**
 * Input for GetBanStatusByEmailUseCase
 */
export interface GetBanStatusByEmailInput {
  email: string;
}

/**
 * Get Ban Status By Email Use Case
 *
 * Checks ban status by email address.
 */
export class GetBanStatusByEmailUseCase {
  execute(input: GetBanStatusByEmailInput) {
    return Effect.gen(function* () {
      const authService = yield* AuthServicePortTag;

      // Get ban status from auth service
      const result = yield* authService.getBanStatusByEmail(input.email);

      return {
        exists: result.exists,
        banned: result.banned,
        bannedUntil: result.bannedUntil,
        reason: result.reason,
      };
    });
  }
}
