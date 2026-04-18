import { Effect, Layer } from "effect";
import type { LocationUpdated } from "@mirai-app/domain";
import { EventBusTag } from "@mirai-app/frameworks/di";
import { LocationBroadcastHandler } from "@mirai-app/use-cases/location/handlers";
import {
  GraphQLSubscriptionBroadcastService,
  type LocationSubscriber,
} from "@mirai-app/frameworks/location";

/**
 * Unsubscribe function for cleanup
 */
interface CleanupFunctions {
  locationUnsubscribe: () => void;
}

/**
 * Global broadcast service instance
 *
 * This singleton is shared between the location handler and GraphQL subscriptions.
 * It's created once at module load time and reused for all location broadcasts.
 */
const broadcastService = new GraphQLSubscriptionBroadcastService();

/**
 * Export the broadcast service for use by GraphQL subscription resolvers
 *
 * The subscription resolvers use this instance to subscribe/unsubscribe
 * to location updates for specific users.
 */
export { broadcastService };

/**
 * Initialize location event handlers by subscribing to domain events
 *
 * This function sets up the LocationBroadcastHandler subscription at application startup.
 * It subscribes the handler to "LocationUpdated" events, enabling real-time location
 * sharing to friends via GraphQL subscriptions.
 *
 * The subscription happens synchronously before returning, ensuring the handler
 * is registered before any events can be processed.
 *
 * IMPORTANT: This Effect requires EventBusTag to be provided via the appLayer.
 *
 * @param broadcastService - The broadcast service instance (optional, uses global singleton if not provided)
 * @returns Effect containing cleanup function for graceful shutdown
 *
 * @example
 * ```typescript
 * // At application startup
 * const { cleanup } = await Effect.runPromise(
 *   initializeLocationHandlers().pipe(Effect.provide(appLayer))
 * );
 *
 * // At graceful shutdown
 * cleanup();
 * ```
 */
export function initializeLocationHandlers() {
  return Effect.gen(function* () {
    yield* Effect.log("Initializing location handlers...");

    const eventBus = yield* EventBusTag;

    // Create the broadcast handler with the shared broadcast service
    const handler = new LocationBroadcastHandler(broadcastService);

    // Subscribe LocationBroadcastHandler to LocationUpdated events
    const subscriptionResult = yield* eventBus.subscribe<LocationUpdated>(
      "LocationUpdated",
      (event) => {
        // The handler's broadcast method returns Effect<void, never, never>
        // which satisfies the IEventBusPort requirement
        return handler.handle(event);
      }
    );

    yield* Effect.log("Location handlers initialized").pipe(
      Effect.annotateLogs({
        eventType: "LocationUpdated",
        handler: "LocationBroadcastHandler",
      })
    );

    // Return cleanup function for graceful shutdown
    const cleanup: CleanupFunctions = {
      locationUnsubscribe: subscriptionResult.unsubscribe,
    };

    return {
      cleanup: () => {
        // Run all unsubscribe functions
        cleanup.locationUnsubscribe();

        // Log shutdown
        Effect.runSync(Effect.log("Location handlers cleaned up"));
      },
    };
  });
}
