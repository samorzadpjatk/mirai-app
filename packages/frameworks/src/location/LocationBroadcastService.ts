import { Effect, Ref, HashMap, HashSet, Option } from "effect";
import type { UserId } from "@mirai-app/domain";
import type {
  ILocationBroadcastService,
  LocationUpdate,
} from "@mirai-app/use-cases/location/handlers";

/**
 * Subscriber callback type for location updates
 *
 * Each subscriber receives location updates via this callback.
 * The callback returns an Effect to allow for async operations and error handling.
 */
export type LocationSubscriber = (update: LocationUpdate) => Effect.Effect<void, never, never>;

/**
 * State management for location broadcast service
 *
 * Uses HashMap for efficient lookups and HashSet to prevent duplicate subscribers.
 */
type BroadcastState = HashMap.HashMap<UserId, HashSet.HashSet<LocationSubscriber>>;

/**
 * GraphQLSubscriptionBroadcastService
 *
 * Implements ILocationBroadcastService to deliver location updates to friends
 * via their active GraphQL subscriptions. This service maintains an in-memory
 * registry of active subscribers and broadcasts updates to them.
 *
 * ## Architecture
 *
 * - Uses Effect.Ref for thread-safe mutable state
 * - Uses HashMap for O(1) subscriber lookup by userId
 * - Uses HashSet to prevent duplicate subscriber registration
 * - Each subscriber receives updates via a callback that returns an Effect
 *
 * ## Error Handling
 *
 * - Per-subscriber error isolation: one subscriber failure doesn't affect others
 * - Failed deliveries are logged but don't propagate errors
 * - broadcast() always returns Effect<void, never, never> as required by interface
 *
 * ## Memory Management
 *
 * - Subscribers must call unsubscribe() when disconnecting
 * - Cleanup is handled automatically when last subscriber is removed
 *
 * @example
 * ```typescript
 * // In GraphQL subscription resolver
 * const broadcastService = new GraphQLSubscriptionBroadcastService();
 *
 * return Effect.gen(function* () {
 *   const subscriber = (update: LocationUpdate) =>
 *     Effect.sync(() => pushToClient(update));
 *
 *   // Subscribe to updates for friendId
 *   yield* broadcastService.subscribe(friendId, subscriber);
 *
 *   // Return cleanup effect
 *   return Effect.onInterrupt(() =>
 *     broadcastService.unsubscribe(friendId, subscriber)
 *   );
 * });
 * ```
 */
export class GraphQLSubscriptionBroadcastService
  implements ILocationBroadcastService
{
  private readonly state: Ref.Ref<BroadcastState>;

  constructor() {
    this.state = Ref.unsafeMake(HashMap.empty<UserId, HashSet.HashSet<LocationSubscriber>>());
  }

  /**
   * Subscribe to location updates for a specific user
   *
   * Registers a subscriber callback that will be invoked when the target user
   * broadcasts a location update. Multiple subscribers can subscribe to the same user.
   *
   * @param userId - The user whose location updates to subscribe to
   * @param subscriber - Callback function that receives location updates
   * @returns Effect that completes when subscription is registered
   */
  subscribe(
    userId: UserId,
    subscriber: LocationSubscriber,
  ): Effect.Effect<void, never, never> {
    return Ref.update(this.state, (state) => {
      const existingSubscribers = Option.getOrElse(
        HashMap.get(state, userId),
        () => HashSet.empty<LocationSubscriber>(),
      );
      const updatedSubscribers = HashSet.add(existingSubscribers, subscriber);
      return HashMap.set(state, userId, updatedSubscribers);
    });
  }

  /**
   * Unsubscribe from location updates for a specific user
   *
   * Removes a previously registered subscriber. If no subscribers remain for
   * the user, the user's entry is removed from the state map.
   *
   * @param userId - The user whose location updates were being subscribed to
   * @param subscriber - The callback function to remove
   * @returns Effect that completes when unsubscription is processed
   */
  unsubscribe(
    userId: UserId,
    subscriber: LocationSubscriber,
  ): Effect.Effect<void, never, never> {
    return Ref.update(this.state, (state) => {
      const existingSubscribers = HashMap.get(state, userId);

      if (Option.isNone(existingSubscribers)) {
        return state;
      }

      const updatedSubscribers = HashSet.remove(
        existingSubscribers.value,
        subscriber,
      );

      // Remove the user entry if no subscribers remain
      if (HashSet.size(updatedSubscribers) === 0) {
        return HashMap.remove(state, userId);
      }

      return HashMap.set(state, userId, updatedSubscribers);
    });
  }

  /**
   * Broadcast a location update to all subscribers of a user
   *
   * This method is called by the LocationBroadcastHandler to deliver location
   * updates to all friends who are subscribed to this user's location.
   *
   * Error isolation: Each subscriber's callback is wrapped with Effect.catchAll
   * to ensure that one subscriber's failure does not affect others.
   *
   * @param userId - The user whose location was updated (target of broadcast)
   * @param update - The location update data
   * @returns Effect that completes when all broadcasts are attempted (never fails)
   */
  broadcast(
    userId: UserId,
    update: LocationUpdate,
  ): Effect.Effect<void, never, never> {
    return Effect.gen(this, function* () {
      const state = yield* Ref.get(this.state);
      const subscribersOption = HashMap.get(state, userId);

      if (Option.isNone(subscribersOption)) {
        // No active subscribers for this user
        return yield* Effect.void;
      }

      const subscribers = subscribersOption.value;

      // Create delivery effects for each subscriber with error isolation
      const deliveries = HashSet.map(subscribers, (subscriber) =>
        subscriber(update).pipe(
          Effect.catchAll((error) =>
            Effect.logWarning("Failed to deliver location update to subscriber", {
              userId,
              error: String(error),
            }),
          ),
        ),
      );

      // Execute all deliveries in parallel with unbounded concurrency
      // Error isolation ensures one failure doesn't block others
      yield* Effect.all(deliveries, { concurrency: "unbounded" }).pipe(
        Effect.catchAll((error) =>
          Effect.logError("Unexpected error in broadcast", {
            userId,
            error: String(error),
          }),
        ),
      );

      return yield* Effect.void;
    });
  }
}
