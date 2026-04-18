import { Effect, Data } from "effect";
import { UserId } from "@mirai-app/domain";
import { PushSubscriptionPortTag } from "../ports/NotificationPort";
import type { UnsubscribeResultDTO } from "../dto/NotificationDTOs";

/**
 * Subscription not found error
 */
export class SubscriptionNotFoundError extends Data.TaggedError("SubscriptionNotFoundError")<{
  token: string;
}> {}

/**
 * Input for UnsubscribeUseCase
 */
export interface UnsubscribeInput {
  userId: UserId;
  token: string;
}

/**
 * Unsubscribe Use Case
 *
 * Unsubscribe from push notifications by token.
 */
export class UnsubscribeUseCase {
  execute(input: UnsubscribeInput) {
    return Effect.gen(function* () {
      const subscriptionPort = yield* PushSubscriptionPortTag;

      const deletedCount = yield* subscriptionPort.deleteByTokenAndUserId(
        input.token,
        UserId.toString(input.userId),
      );

      if (deletedCount === 0) {
        return yield* Effect.fail(
          new SubscriptionNotFoundError({ token: input.token }),
        );
      }

      return {
        success: true,
        deletedCount,
      } as UnsubscribeResultDTO;
    });
  }
}
