import { Effect, Queue } from "effect";
import { UserId } from "@mirai-app/domain";
import { builder } from "../../builder.js";
import type { FriendLocationEvent } from "./types.js";
import {
  GraphQLSubscriptionBroadcastService,
  type LocationSubscriber,
} from "../../../location/LocationBroadcastService.js";
import type { LocationUpdate } from "@mirai-app/use-cases/location/handlers";
import { isAuthenticated } from "../../context.js";

/**
 * Global broadcast service instance
 *
 * This singleton manages all location update subscriptions across the application.
 * It's shared between the LocationBroadcastHandler (publishing) and
 * GraphQL subscription resolvers (subscribing).
 */
const broadcastService = new GraphQLSubscriptionBroadcastService();

/**
 * Export the broadcast service for use by LocationBroadcastHandler
 *
 * The handler uses this instance to broadcast location updates to
 * all subscribed friends.
 */
export { broadcastService };

/**
 * Location subscription input type
 */
interface LocationSubscriptionArgs {
  friendId: string;
}

/**
 * friendLocationEvent subscription
 *
 * Allows a user to subscribe to real-time location updates from a friend.
 * Note: Authorization (checking if viewer is in friend's sharing list)
 * should be performed before establishing the subscription.
 *
 * ## Authorization
 *
 * - User must be authenticated
 * - User should be in the friend's location sharing list (enforced at API gateway or prior validation)
 *
 * ## Error Handling
 *
 * - Unauthorized access: Subscription returns error
 * - Connection errors: Handled by underlying transport
 * - Missing friend: Stream completes normally (no updates)
 *
 * ## Example
 *
 * ```graphql
 * subscription {
 *   friendLocationEvent(friendId: "user-123") {
 *     userId
 *     latitude
 *     longitude
 *     accuracy
 *     timestamp
 *   }
 * }
 * ```
 */
builder.subscriptionField("friendLocationEvent", (t) =>
  t.field({
    type: "FriendLocationEvent",
    description: "Subscribe to real-time location updates from a friend",
    args: {
      friendId: t.arg.id({
        required: true,
        description: "The friend ID to subscribe to location updates for",
      }),
    },
    authScopes: {
      authenticated: true,
    },
    subscribe: async function* (
      _parent: unknown,
      args: LocationSubscriptionArgs,
      ctx,
    ): AsyncGenerator<FriendLocationEvent, void, unknown> {
      // Validate authentication
      if (!isAuthenticated(ctx)) {
        throw new Error("Authentication required for location subscriptions");
      }

      // Convert string friendId to UserId using unsafeCreate
      // The validation should have already occurred at the API boundary
      const friendId = UserId.unsafeCreate(args.friendId);

      // Create an unbounded queue for location events
      const queue = await Effect.runPromise(Queue.unbounded<FriendLocationEvent>());

      // Define subscriber callback that pushes to queue
      const subscriber: LocationSubscriber = (update: LocationUpdate) => {
        return Effect.gen(function* () {
          yield* queue.offer({
            userId: update.userId,
            latitude: update.latitude,
            longitude: update.longitude,
            accuracy: update.accuracy,
            timestamp: update.timestamp,
          });
        });
      };

      // Subscribe to updates for this friend
      await Effect.runPromise(broadcastService.subscribe(friendId, subscriber));

      try {
        // Yield updates as they arrive
        while (true) {
          const event = await Effect.runPromise(queue.take);
          yield event;
        }
      } finally {
        // Cleanup: unsubscribe when client disconnects or generator is closed
        await Effect.runPromise(broadcastService.unsubscribe(friendId, subscriber));
        await Effect.runPromise(queue.shutdown);
      }
    },
    resolve: (event) => event,
  }),
);
