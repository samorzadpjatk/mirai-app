import { Effect, Layer } from "effect";
import type { NotificationCreated, IPortError } from "@mirai-app/domain";
import { EventBusTag } from "@mirai-app/frameworks/di";
import { NotificationSendHandler } from "@mirai-app/use-cases/notification";
import {
  PushSubscriptionPortTag,
  NotificationDeliveryPortTag,
  NotificationServicePortTag,
} from "@mirai-app/use-cases/notification/ports/NotificationPort";

/**
 * Unsubscribe function collection for cleanup
 */
interface CleanupFunctions {
  notificationUnsubscribe: () => void;
}

/**
 * Initialize notification handlers by subscribing to domain events
 *
 * This function sets up the event handler subscriptions at application startup.
 * It subscribes the NotificationSendHandler to "NotificationCreated" events,
 * enabling asynchronous push notification delivery.
 *
 * The subscription happens synchronously before returning, ensuring handlers
 * are registered before any events can be processed.
 *
 * IMPORTANT: This Effect requires the following Context.Tags to be provided:
 * - EventBusTag (for event subscription)
 * - PushSubscriptionPortTag (for fetching push subscriptions)
 * - NotificationDeliveryPortTag (for tracking delivery status)
 * - NotificationServicePortTag (for sending notifications)
 *
 * These are typically provided by the appLayer when running the Effect:
 * ```typescript
 * const { cleanup } = await Effect.runPromise(
 *   initializeNotificationHandlers().pipe(Effect.provide(appLayer))
 * );
 * ```
 *
 * @returns Effect containing cleanup function for graceful shutdown
 *
 * @example
 * ```typescript
 * // At application startup
 * const { cleanup } = await Effect.runPromise(
 *   initializeNotificationHandlers().pipe(Effect.provide(appLayer))
 * );
 *
 * // At graceful shutdown
 * cleanup();
 * ```
 */
export function initializeNotificationHandlers() {
  return Effect.gen(function* () {
    yield* Effect.log("Initializing notification handlers...");

    const eventBus = yield* EventBusTag;

    // Yield the required services to ensure they're available
    // These will be captured and provided to the handler when called
    const pushSubscriptionPort = yield* PushSubscriptionPortTag;
    const deliveryPort = yield* NotificationDeliveryPortTag;
    const servicePort = yield* NotificationServicePortTag;

    // Create a layer with the captured services for handler injection
    const handlerLayer = Layer.mergeAll(
      Layer.succeed(PushSubscriptionPortTag, pushSubscriptionPort),
      Layer.succeed(NotificationDeliveryPortTag, deliveryPort),
      Layer.succeed(NotificationServicePortTag, servicePort)
    );

    // Subscribe NotificationSendHandler to NotificationCreated events
    // The handler's dependencies are provided via the captured handlerLayer
    const subscriptionResult = yield* eventBus.subscribe<NotificationCreated>(
      "NotificationCreated",
      (event) => {
        const handler = new NotificationSendHandler();
        // Provide the captured services to the handler's Effect
        // This satisfies the IEventBusPort requirement of Effect<void, never, never>
        const handled = handler.handle(event);
        return Effect.provide(handled, handlerLayer) as Effect.Effect<void, never, never>;
      }
    );

    yield* Effect.log("Notification handlers initialized").pipe(
      Effect.annotateLogs({
        eventType: "NotificationCreated",
        handler: "NotificationSendHandler",
      })
    );

    // Return cleanup function for graceful shutdown
    const cleanup: CleanupFunctions = {
      notificationUnsubscribe: subscriptionResult.unsubscribe,
    };

    return {
      cleanup: () => {
        // Run all unsubscribe functions
        cleanup.notificationUnsubscribe();

        // Log shutdown
        Effect.runSync(Effect.log("Notification handlers cleaned up"));
      },
    };
  });
}
