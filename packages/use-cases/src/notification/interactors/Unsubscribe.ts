import { Effect, Data } from "effect";
import { PushSubscriptionPortTag } from "../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { UnsubscribeResultDTO } from "../dto/NotificationDTOs";

/**
 * Subscription not found error
 */
export class SubscriptionNotFoundError extends Data.TaggedError(
  "SubscriptionNotFoundError",
)<{
  token: string;
}>() {}

/**
 * Input for UnsubscribeUseCase
 */
export interface UnsubscribeInput {
  userId: string;
  token: string;
}

/**
 * Unsubscribe Use Case
 *
 * Unsubscribe from push notifications by token.
 */
export class UnsubscribeUseCase {
  execute(
    input: UnsubscribeInput,
  ): Effect.Effect<
    UnsubscribeResultDTO,
    ApplicationError | SubscriptionNotFoundError,
    PushSubscriptionPortTag
  > {
    return Effect.gen(function* () {
      const subscriptionPort = yield* PushSubscriptionPortTag;

      const deletedCount = yield* subscriptionPort.deleteByTokenAndUserId(
        input.token,
        input.userId,
      );

      if (deletedCount === 0) {
        return yield* Effect.fail(
          new SubscriptionNotFoundError({ token: input.token }),
        );
      }

      return {
        success: true,
        deletedCount,
      };
    });
  }
}
