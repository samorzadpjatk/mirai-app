import { Effect } from "effect";
import { PushSubscriptionPortTag } from "../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { UnsubscribeResultDTO } from "../dto/NotificationDTOs";

/**
 * Input for UnsubscribeAllUseCase
 */
export interface UnsubscribeAllInput {
  userId: string;
}

/**
 * Unsubscribe All Use Case
 *
 * Unsubscribe all push notifications for a user.
 */
export class UnsubscribeAllUseCase {
  execute(
    input: UnsubscribeAllInput,
  ): Effect.Effect<
    UnsubscribeResultDTO,
    ApplicationError,
    PushSubscriptionPortTag
  > {
    return Effect.gen(function* () {
      const subscriptionPort = yield* PushSubscriptionPortTag;

      const deletedCount = yield* subscriptionPort.deleteAllByUserId(
        input.userId,
      );

      return {
        success: true,
        deletedCount,
      };
    });
  }
}
