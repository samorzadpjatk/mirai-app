import { Effect } from "effect";
import { UserId, PushSubscriptionId, type PushSubscription } from "@mirai-app/domain";
import { PushSubscriptionPortTag } from "../ports/NotificationPort";
import type { SubscribeResultDTO } from "../dto/NotificationDTOs";

/**
 * Input for SubscribeUseCase
 */
export interface SubscribeInput {
  userId: UserId;
  token: string;
}

/**
 * Subscribe Use Case
 *
 * Subscribe to push notifications by creating or updating a push subscription.
 */
export class SubscribeUseCase {
  execute(input: SubscribeInput) {
    return Effect.gen(function* () {
      const subscriptionPort = yield* PushSubscriptionPortTag;

      const now = new Date();
      const existingSubscription = yield* subscriptionPort.findByUserIdAndToken(
        input.userId,
        input.token,
      );

      if (existingSubscription) {
        // Update existing subscription
        const updated = yield* subscriptionPort.update({
          ...existingSubscription,
          updatedAt: now,
        });
        return {
          success: true,
          id: updated.id,
        };
      }

      // Create new subscription
      const newSubscription = yield* subscriptionPort.create({
        id: PushSubscriptionId.create(crypto.randomUUID()),
        userId: input.userId,
        token: input.token,
        createdAt: now,
        updatedAt: now,
      } as PushSubscription);

      return {
        success: true,
        id: newSubscription.id,
      };
    });
  }
}
