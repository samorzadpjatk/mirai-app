import { Effect, Queue } from "effect";
import { UserId } from "@mirai-app/domain";
import type { IPortError } from "@mirai-app/domain";
import { LocationPortTag } from "@mirai-app/use-cases/location/ports";
import { builder } from "../../builder.js";
import type { FriendLocationEvent } from "./types.js";
import {
  GraphQLSubscriptionBroadcastService,
  type LocationSubscriber,
} from "../../../location/LocationBroadcastService.js";
import type { LocationUpdate } from "@mirai-app/use-cases/location/handlers";
import { requireAuth, runEffect } from "../../context.js";

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
 * Check if viewer is authorized to subscribe to friend's location
 *
 * Authorization rule: The viewer must be in the friend's sharing list.
 * This ensures users can only receive location updates from friends
 * who have explicitly shared their location with them.
 */
function checkLocationSharingAuthorization(
  friendId: UserId,
  viewerUserId: string,
) {
  return Effect.gen(function* () {
    const locationPort = yield* LocationPortTag;
    const sharingList = yield* locationPort.getSharingListForUser(friendId);
    return sharingList.some((userId) => UserId.toString(userId) === viewerUserId);
  });
}

/**
 * friendLocationEvent subscription
 *
 * Allows a user to subscribe to real-time location updates from a friend.
 * Only friends who are in the sharing list receive updates.
 *
 * ## Authorization
 *
 * - User must be authenticated
 * - User must be in the friend's location sharing list (enforced via LocationPort)
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
    subscribe: async function* (
      _parent: unknown,
      args: LocationSubscriptionArgs,
      ctx,
    ): AsyncGenerator<FriendLocationEvent, void, unknown> {
      // Validate authentication
      const auth = requireAuth(ctx);
      const viewerUserId = auth.userId;

      // Convert string friendId to UserId using unsafeCreate
      // The validation should have already occurred at the API boundary
      const friendId = UserId.unsafeCreate(args.friendId);

      // Check authorization: viewer must be in friend's sharing list
      const authEffect = checkLocationSharingAuthorization(friendId, viewerUserId);
      const isAuthorized = await runEffect(ctx, authEffect);

      if (!isAuthorized) {
        throw new Error(
          "Unauthorized: You are not in this friend's location sharing list",
        );
      }

      // Create an unbounded queue for location events
      const queue = await Effect.runPromise(Queue.unbounded<FriendLocationEvent>());

      // Define subscriber callback that pushes to queue
      const subscriber: LocationSubscriber = (update: LocationUpdate) => {
        return Effect.sync(() => {
          void Effect.runPromise(
            queue.offer({
              userId: update.userId,
              firstName: update.firstName ?? null,
              lastName: update.lastName ?? null,
              image: update.image ?? null,
              latitude: update.latitude,
              longitude: update.longitude,
              accuracy: update.accuracy,
              timestamp: update.timestamp,
              isOnline: update.isOnline ?? true,
            }),
          );
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
    resolve: (event: FriendLocationEvent): FriendLocationEvent => event,
  }),
);
