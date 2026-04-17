import { Effect } from "effect";
import { PushSubscriptionPortTag } from "../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { SubscriptionStatusDTO } from "../dto/NotificationDTOs";

/**
 * Input for GetSubscriptionStatusUseCase
 */
export interface GetSubscriptionStatusInput {
  userId: string;
}

/**
 * Get Subscription Status Use Case
 *
 * Get the subscription status for a user.
 */
export class GetSubscriptionStatusUseCase {
  execute(
    input: GetSubscriptionStatusInput,
  ): Effect.Effect<
    SubscriptionStatusDTO,
    ApplicationError,
    PushSubscriptionPortTag
  > {
    return Effect.gen(function* () {
      const subscriptionPort = yield* PushSubscriptionPortTag;

      const subscriptions = yield* subscriptionPort.findByUserId(input.userId);

      return {
        isSubscribed: subscriptions.length > 0,
        subscriptions: subscriptions.map((s) => ({
          id: s.id,
          token: s.token,
          createdAt: s.createdAt,
        })),
      };
    });
  }
}
