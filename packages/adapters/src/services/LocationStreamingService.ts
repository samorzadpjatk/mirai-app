import type { LocationUpdated } from "@mirai-app/domain";
import type { EventBus, EventHandler } from "./EventBus";
import type { ConnectionManager, BroadcastLocation } from "./ConnectionManager";
import { Effect, Data } from "effect";

/**
 * LocationStreamingError for streaming operations
 */
export class LocationStreamingError extends Data.TaggedError(
  "LocationStreamingError",
)<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "LOCATION_STREAMING_ERROR" as const;
}

/**
 * LocationStreamingService
 *
 * Coordinates location updates between use cases and real-time broadcasting.
 *
 * Phase 2: Real-Time Architecture
 * - Subscribes to LocationUpdated events via EventBus
 * - Broadcasts to friends via ConnectionManager
 * - Throttles updates (1/sec per user)
 * - Tracks which friends are online
 *
 * Architecture:
 * ```
 * Client updates location
 *    |
 *    v
 * updateLocationUseCase (Effect-based)
 *    |
 *    v
 * eventBus.publish(LocationUpdated)
 *    |
 *    v
 * LocationStreamingService (handler)
 *    |
 *    v
 * connectionManager.broadcastLocation(userId, location, friendIds)
 *    |
 *    v
 * RealtimePort.broadcast(channel, "location_updated", location)
 *    |
 *    v
 * Friends receive via WebSocket subscription
 * ```
 *
 * Throttling:
 * - Updates are throttled to 1 per second per user
 * - This prevents battery drain and server overload
 * - ConnectionManager enforces throttling
 *
 * Friend Discovery:
 * - Friends are determined by location sharing settings
 * - Repository queries who has the user in their sharing list
 * - Only online friends receive real-time updates
 *
 * @example
 * ```typescript
 * // In backend startup
 * const streamingService = new LocationStreamingService(
 *   eventBus,
 *   connectionManager,
 *   locationRepository
 * );
 * streamingService.initialize();
 *
 * // Location updates are streamed automatically via EventBus
 * ```
 */
export class LocationStreamingService {
  private unsubscribe: (() => Effect.Effect<void, never, never>) | null = null;
  private isInitialized = false;

  constructor(
    private readonly eventBus: EventBus,
    private readonly connectionManager: ConnectionManager,
    private readonly locationRepository: {
      findFriendsToNotify(userId: string): Promise<string[]>;
    },
  ) {}

  /**
   * Initialize the service and subscribe to events
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn("LocationStreamingService already initialized");
      return;
    }

    // Subscribe to LocationUpdated events using legacy handler for compatibility
    const subscription = this.eventBus.subscribeLegacy(
      "LocationUpdated",
      this.handleLocationUpdated.bind(this),
    );

    this.unsubscribe = subscription.unsubscribe;
    this.isInitialized = true;
    console.log("LocationStreamingService initialized");
  }

  /**
   * Initialize using Effect-based API
   *
   * @returns Effect that completes when initialization is done
   */
  initializeEffect(): Effect.Effect<void, LocationStreamingError, never> {
    return Effect.gen(this, function* () {
      if (this.isInitialized) {
        console.warn("LocationStreamingService already initialized");
        return;
      }

      // Create Effect-based handler
      const handler = (event: LocationUpdated) =>
        this.handleLocationUpdatedEffect(event);

      // Subscribe to LocationUpdated events
      const subscription = this.eventBus.subscribe(
        "LocationUpdated",
        handler as any,
      );

      this.unsubscribe = subscription.unsubscribe;
      this.isInitialized = true;
      console.log("LocationStreamingService initialized");
    });
  }

  /**
   * Shutdown the service
   */
  shutdown(): void {
    if (this.unsubscribe) {
      Effect.runSync(this.unsubscribe());
      this.unsubscribe = null;
    }
    this.isInitialized = false;
    console.log("LocationStreamingService shut down");
  }

  /**
   * Shutdown using Effect-based API
   *
   * @returns Effect that completes when shutdown is done
   */
  shutdownEffect(): Effect.Effect<void, never, never> {
    return Effect.gen(this, function* () {
      if (this.unsubscribe) {
        yield* this.unsubscribe();
        this.unsubscribe = null;
      }
      this.isInitialized = false;
      console.log("LocationStreamingService shut down");
    });
  }

  /**
   * Handle LocationUpdated events (legacy async version)
   */
  private async handleLocationUpdated(event: LocationUpdated): Promise<void> {
    try {
      // Get list of friends who should receive this update
      const friendIds = await this.locationRepository.findFriendsToNotify(
        event.userId,
      );

      if (friendIds.length === 0) {
        return; // No friends to notify
      }

      // Check if any friends are online
      const onlineFriendIds = friendIds.filter((id) =>
        this.connectionManager.isUserOnline(id),
      );

      if (onlineFriendIds.length === 0) {
        return; // No online friends to broadcast to
      }

      // Prepare broadcast location
      const location: BroadcastLocation = {
        userId: event.userId,
        latitude: event.latitude,
        longitude: event.longitude,
        accuracy: event.accuracy,
        altitude: event.altitude,
        speed: event.speed,
        timestamp: event.occurredAt,
      };

      // Broadcast to online friends using Effect
      const result = await Effect.runPromise(
        this.connectionManager.broadcastLocation(
          event.userId,
          location,
          onlineFriendIds,
        ),
      );

      if (result.throttled) {
        console.log(
          `[LocationStreamingService] Location update throttled for user ${event.userId}`,
        );
        return;
      }

      if (result.success) {
        console.log(
          `[LocationStreamingService] Broadcast location to ${result.broadcastCount} friends for user ${event.userId}`,
        );
      }

      // Log any errors
      if (result.errors.length > 0) {
        console.error(
          `[LocationStreamingService] Broadcast errors:`,
          result.errors,
        );
      }
    } catch (error) {
      console.error(
        `[LocationStreamingService] Error handling location update for user ${event.userId}:`,
        error,
      );
      // Don't throw - streaming failures shouldn't crash the request
    }
  }

  /**
   * Handle LocationUpdated events (Effect-based version)
   */
  private handleLocationUpdatedEffect(
    event: LocationUpdated,
  ): Effect.Effect<void, LocationStreamingError, never> {
    return Effect.gen(this, function* () {
      // Get list of friends who should receive this update
      const friendIds = yield* Effect.tryPromise({
        try: () => this.locationRepository.findFriendsToNotify(event.userId),
        catch: (error) =>
          new LocationStreamingError({
            operation: "handleLocationUpdated",
            message: `Failed to find friends to notify for user ${event.userId}`,
            cause: error,
          }),
      });

      if (friendIds.length === 0) {
        return; // No friends to notify
      }

      // Check if any friends are online
      const onlineFriendIds = friendIds.filter((id) =>
        this.connectionManager.isUserOnline(id),
      );

      if (onlineFriendIds.length === 0) {
        return; // No online friends to broadcast to
      }

      // Prepare broadcast location
      const location: BroadcastLocation = {
        userId: event.userId,
        latitude: event.latitude,
        longitude: event.longitude,
        accuracy: event.accuracy,
        altitude: event.altitude,
        speed: event.speed,
        timestamp: event.occurredAt,
      };

      // Broadcast to online friends
      const result = yield* this.connectionManager.broadcastLocation(
        event.userId,
        location,
        onlineFriendIds,
      );

      if (result.throttled) {
        console.log(
          `[LocationStreamingService] Location update throttled for user ${event.userId}`,
        );
        return;
      }

      if (result.success) {
        console.log(
          `[LocationStreamingService] Broadcast location to ${result.broadcastCount} friends for user ${event.userId}`,
        );
      }

      // Log any errors
      if (result.errors.length > 0) {
        console.error(
          `[LocationStreamingService] Broadcast errors:`,
          result.errors,
        );
      }
    });
  }

  /**
   * Manually trigger a location broadcast (for testing or direct use)
   *
   * @param userId - The user whose location is being shared
   * @param latitude - Location latitude
   * @param longitude - Location longitude
   * @param accuracy - Location accuracy (optional)
   * @returns Effect that resolves to broadcast result
   */
  broadcast(
    userId: string,
    latitude: number,
    longitude: number,
    accuracy: number | null = null,
  ): Effect.Effect<
    {
      success: boolean;
      broadcastCount: number;
      throttled: boolean;
      errors: string[];
    },
    LocationStreamingError,
    never
  > {
    return Effect.gen(this, function* () {
      // Get friends who should receive this update
      const friendIds = yield* Effect.tryPromise({
        try: () => this.locationRepository.findFriendsToNotify(userId),
        catch: (error) =>
          new LocationStreamingError({
            operation: "broadcast",
            message: `Failed to find friends to notify for user ${userId}`,
            cause: error,
          }),
      });

      if (friendIds.length === 0) {
        return {
          success: true,
          broadcastCount: 0,
          throttled: false,
          errors: [],
        };
      }

      // Prepare location
      const location: BroadcastLocation = {
        userId,
        latitude,
        longitude,
        accuracy,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      // Broadcast
      return yield* this.connectionManager.broadcastLocation(
        userId,
        location,
        friendIds,
      );
    });
  }

  /**
   * Get streaming statistics (for monitoring)
   */
  getStats(): {
    onlineUsers: number;
    totalConnections: number;
    isInitialized: boolean;
  } {
    return {
      onlineUsers: this.connectionManager.getOnlineUsers().length,
      totalConnections: this.connectionManager.getTotalConnectionCount(),
      isInitialized: this.isInitialized,
    };
  }

  /**
   * Get streaming statistics using Effect
   */
  getStatsEffect(): Effect.Effect<
    {
      onlineUsers: number;
      totalConnections: number;
      isInitialized: boolean;
    },
    never,
    never
  > {
    return Effect.sync(() => this.getStats());
  }
}
