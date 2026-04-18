import type { Effect } from "effect";
import type { UserId } from "@mirai-app/domain";

/**
 * LocationUpdate - Data transfer object for location broadcast
 *
 * Contains the location update information that will be sent to friends.
 */
export interface LocationUpdate {
  /** The user who updated their location */
  readonly userId: UserId;

  /** Latitude coordinate in decimal degrees (-90 to 90) */
  readonly latitude: number;

  /** Longitude coordinate in decimal degrees (-180 to 180) */
  readonly longitude: number;

  /** GPS accuracy in meters (null if unavailable) */
  readonly accuracy: number | null;

  /** When the location update occurred */
  readonly timestamp: Date;
}

/**
 * ILocationBroadcastService - Interface for broadcasting location updates to friends
 *
 * This interface defines the contract for delivering location updates to friends
 * via their active subscriptions. Implementations may use GraphQL subscriptions,
 * WebSockets, or other real-time delivery mechanisms.
 *
 * The service is designed for fire-and-forget delivery:
 * - Successful delivery is logged but does not block
 * - Failed delivery is logged and dropped (offline friends will fetch latest on reconnect)
 * - No retry logic to prevent blocking other deliveries
 *
 * Error isolation: The broadcast method must never fail (Effect<void, never, never>)
 * to ensure handler errors don't propagate to the EventBus.
 *
 * @example
 * ```typescript
 * // In handler
 * const broadcastService = new GraphQLSubscriptionBroadcastService(subscriptionManager);
 * const handler = new LocationBroadcastHandler(broadcastService);
 * ```
 */
export interface ILocationBroadcastService {
  /**
   * Broadcast a location update to a specific user
   *
   * This method delivers the location update to the specified user via their
   * active subscription. If the user is offline or the delivery fails, the
   * error is handled internally and logged - no exception is thrown.
   *
   * The Effect always succeeds (never fails) to ensure error isolation in
   * the event handler. Failed deliveries are logged as warnings.
   *
   * @param userId - The friend to receive the location update
   * @param update - The location update data
   * @returns Effect that completes when broadcast is done (never fails)
   */
  broadcast(userId: UserId, update: LocationUpdate): Effect.Effect<void, never, never>;
}
