import type { LocationUpdated } from "@mirai-app/domain";
import type { EventBus, EventHandler } from "./EventBus";
import type { ConnectionManager, BroadcastLocation } from "./ConnectionManager";

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
  private unsubscribe: (() => void) | null = null;
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

    // Subscribe to LocationUpdated events
    this.unsubscribe = this.eventBus.subscribe(
      "LocationUpdated",
      this.handleLocationUpdated.bind(this) as EventHandler,
    ).unsubscribe;

    this.isInitialized = true;
    console.log("LocationStreamingService initialized");
  }

  /**
   * Shutdown the service
   */
  shutdown(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isInitialized = false;
    console.log("LocationStreamingService shut down");
  }

  /**
   * Handle LocationUpdated events
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

      // Broadcast to online friends
      const result = await this.connectionManager.broadcastLocation(
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
    } catch (error) {
      console.error(
        `[LocationStreamingService] Error handling location update for user ${event.userId}:`,
        error,
      );
      // Don't throw - streaming failures shouldn't crash the request
    }
  }

  /**
   * Manually trigger a location broadcast (for testing or direct use)
   *
   * @param userId - The user whose location is being shared
   * @param latitude - Location latitude
   * @param longitude - Location longitude
   * @param accuracy - Location accuracy (optional)
   * @returns Broadcast result
   */
  async broadcast(
    userId: string,
    latitude: number,
    longitude: number,
    accuracy: number | null = null,
  ): Promise<{
    success: boolean;
    broadcastCount: number;
    throttled: boolean;
    errors: string[];
  }> {
    // Get friends who should receive this update
    const friendIds = await this.locationRepository.findFriendsToNotify(userId);

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
    return this.connectionManager.broadcastLocation(
      userId,
      location,
      friendIds,
    );
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
}
