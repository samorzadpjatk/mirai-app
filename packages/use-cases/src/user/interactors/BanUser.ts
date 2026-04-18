import { Effect } from "effect";
import type { IPortError } from "@mirai-app/domain";
import { UserId } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import { AuthServicePortTag } from "../ports/AuthServicePort";
import type { BanUserResultDTO } from "../dto/UserDTOs";
import {
  UserNotFoundError,
  InvalidBanDateError,
  AuthUserNotFoundError,
} from "../errors/UserErrors";

/**
 * Input for BanUserUseCase
 */
export interface BanUserInput {
  userId: string;
  bannedUntilMs: number;
  reason?: string;
}

/**
 * Ban User Use Case
 *
 * Bans a user until a specific date.
 */
export class BanUserUseCase {
  execute(input: BanUserInput) {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;
      const authService = yield* AuthServicePortTag;

      // Convert string to branded UserId
      const userId = UserId.unsafeCreate(input.userId);

      // Find user by ID
      const user = yield* userPort.findById(userId);

      if (!user) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: input.userId }),
        );
      }

      // Validate ban date
      const bannedUntil = new Date(input.bannedUntilMs);

      if (Number.isNaN(bannedUntil.getTime())) {
        return yield* Effect.fail(
          new InvalidBanDateError({ reason: "Invalid ban date" }),
        );
      }

      const diffMs = bannedUntil.getTime() - Date.now();
      if (diffMs <= 0) {
        return yield* Effect.fail(
          new InvalidBanDateError({ reason: "Ban date must be in the future" }),
        );
      }

      // Ban user via auth service
      const result = yield* authService.banUser({
        authUserId: user.authUserId,
        bannedUntilMs: input.bannedUntilMs,
        reason: input.reason,
      });

      return result;
    });
  }
}
