import type { RealtimePort, ConnectionState } from "@mirai-app/use-cases";

/**
 * ConnectionInfo
 *
 * Information about a connected user session.
 */
export interface ConnectionInfo {
  userId: string;
  connectionId: string;
  connectedAt: Date;
  lastActivityAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * LocationUpdate
 *
 * Location data broadcast to friends.
 */
export interface BroadcastLocation {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  timestamp: Date;
}

/**
 * ConnectionManager
 *
 * Manages WebSocket connections for real-time location streaming.
 *
 * Phase 2: Real-Time Architecture
 * - Replaces Supabase Realtime for location broadcasting
 * - Tracks which friends are online
 * - Broadcasts location updates to connected friends
 * - Handles disconnections gracefully
 *
 * Architecture:
 * ```
 * User A updates location
 *    |
 *    v
 * ConnectionManager
 *    |
 *    v
 * Query: Who follows User A? (friendIds)
 *    |
 *    v
 * For each online friend:
 *    RealtimePort.broadcast(friendChannel, "location_update", location)
 * ```
 *
 * Design Decisions:
 * - Uses RealtimePort abstraction (not tied to specific WebSocket implementation)
 * - In-memory connection tracking (fast, no database queries)
 * - Throttling: 1 update/sec per user (configurable)
 * - LRU eviction under memory pressure
 * - Graceful degradation if broadcast fails
 *
 * @example
 * ```typescript
 * // In backend startup
 * const connectionManager = new ConnectionManager(realtimePort);
 *
 * // When user connects (WebSocket upgrade)
 * connectionManager.userConnected(userId, connectionId);
 *
 * // When location is updated
 * await connectionManager.broadcastLocation(userId, location, friendIds);
 *
 * // When user disconnects
 * connectionManager.userDisconnected(userId, connectionId);
 * ```
 */
export class ConnectionManager {
  // Map<userId, Map<connectionId, ConnectionInfo>>
  private connections: Map<string, Map<string, ConnectionInfo>> = new Map();

  // Throttling: Map<userId, lastUpdateTimestamp>
  private lastLocationUpdate: Map<string, number> = new Map();

  // Configuration
  private readonly throttleMs: number;
  private readonly maxConnectionsPerUser: number;

  constructor(
    private readonly realtimePort: RealtimePort,
    options: {
      throttleMs?: number;
      maxConnectionsPerUser?: number;
    } = {},
  ) {
    this.throttleMs = options.throttleMs ?? 1000; // 1 second default
    this.maxConnectionsPerUser = options.maxConnectionsPerUser ?? 5;
  }

  /**
   * Register a user connection
   *
   * Called when a WebSocket connection is established.
   *
   * @param userId - The user ID
   * @param connectionId - Unique connection identifier
   * @param metadata - Optional connection metadata
   * @returns The created connection info
   */
  userConnected(
    userId: string,
    connectionId: string,
    metadata?: Record<string, unknown>,
  ): ConnectionInfo {
    const now = new Date();

    // Get or create user connection map
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Map());
    }

    const userConnections = this.connections.get(userId)!;

    // Enforce max connections per user (LRU eviction)
    if (userConnections.size >= this.maxConnectionsPerUser) {
      const oldestConnection = this.findOldestConnection(userConnections);
      if (oldestConnection) {
        userConnections.delete(oldestConnection);
      }
    }

    // Create connection info
    const connectionInfo: ConnectionInfo = {
      userId,
      connectionId,
      connectedAt: now,
      lastActivityAt: now,
      metadata,
    };

    userConnections.set(connectionId, connectionInfo);

    return connectionInfo;
  }

  /**
   * Unregister a user connection
   *
   * Called when a WebSocket connection closes.
   *
   * @param userId - The user ID
   * @param connectionId - The connection ID to remove
   * @returns true if a connection was removed
   */
  userDisconnected(userId: string, connectionId: string): boolean {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return false;

    const removed = userConnections.delete(connectionId);

    // Clean up empty user entries
    if (userConnections.size === 0) {
      this.connections.delete(userId);
      this.lastLocationUpdate.delete(userId);
    }

    return removed;
  }

  /**
   * Broadcast location to online friends
   *
   * This is the core method for real-time location sharing.
   * It throttles updates and only broadcasts to online friends.
   *
   * @param userId - The user whose location updated
   * @param location - The location data to broadcast
   * @param friendIds - List of friend user IDs who should receive the update
   * @returns Result summary
   *
   * @example
   * ```typescript
   * await connectionManager.broadcastLocation(
   *   "user-123",
   *   {
   *     userId: "user-123",
   *     latitude: 40.7128,
   *     longitude: -74.0060,
   *     accuracy: 10,
   *     altitude: null,
   *     speed: 5.5,
   *     timestamp: new Date()
   *   },
   *   ["friend-456", "friend-789"]
   * );
   * ```
   */
  async broadcastLocation(
    userId: string,
    location: BroadcastLocation,
    friendIds: string[],
  ): Promise<{
    success: boolean;
    broadcastCount: number;
    throttled: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check throttle
    const now = Date.now();
    const lastUpdate = this.lastLocationUpdate.get(userId);
    if (lastUpdate && now - lastUpdate < this.throttleMs) {
      return {
        success: false,
        broadcastCount: 0,
        throttled: true,
        errors: ["Update throttled: too frequent"],
      };
    }

    // Update throttle timestamp
    this.lastLocationUpdate.set(userId, now);

    // Update activity timestamp for all user connections
    this.updateActivity(userId);

    // Broadcast to each online friend
    let broadcastCount = 0;
    const channel = `location:${userId}`;

    for (const friendId of friendIds) {
      // Check if friend is online (has active connections)
      if (!this.isUserOnline(friendId)) {
        continue; // Skip offline friends
      }

      try {
        // Broadcast via RealtimePort
        const result = await this.realtimePort.broadcast(
          channel,
          "location_updated",
          location,
        );

        if (result.kind === "ok") {
          broadcastCount++;
        } else {
          errors.push(`Friend ${friendId}: ${result.error.message}`);
        }
      } catch (error) {
        errors.push(
          `Friend ${friendId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return {
      success: broadcastCount > 0 || friendIds.length === 0,
      broadcastCount,
      throttled: false,
      errors,
    };
  }

  /**
   * Check if a user is currently online
   *
   * @param userId - The user to check
   * @returns true if the user has active connections
   */
  isUserOnline(userId: string): boolean {
    const userConnections = this.connections.get(userId);
    return userConnections !== undefined && userConnections.size > 0;
  }

  /**
   * Get all online users
   *
   * @returns Array of user IDs that are currently online
   */
  getOnlineUsers(): string[] {
    const online: string[] = [];
    for (const [userId, connections] of this.connections) {
      if (connections.size > 0) {
        online.push(userId);
      }
    }
    return online;
  }

  /**
   * Get connection count for a user
   *
   * @param userId - The user to check
   * @returns Number of active connections
   */
  getConnectionCount(userId: string): number {
    return this.connections.get(userId)?.size ?? 0;
  }

  /**
   * Get total connection count across all users
   *
   * @returns Total number of active connections
   */
  getTotalConnectionCount(): number {
    let total = 0;
    for (const [, connections] of this.connections) {
      total += connections.size;
    }
    return total;
  }

  /**
   * Get connection info for a specific connection
   *
   * @param userId - The user ID
   * @param connectionId - The connection ID
   * @returns ConnectionInfo or undefined if not found
   */
  getConnection(
    userId: string,
    connectionId: string,
  ): ConnectionInfo | undefined {
    return this.connections.get(userId)?.get(connectionId);
  }

  /**
   * Get all connections for a user
   *
   * @param userId - The user ID
   * @returns Array of connection infos
   */
  getUserConnections(userId: string): ConnectionInfo[] {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return [];
    return Array.from(userConnections.values());
  }

  /**
   * Update last activity timestamp for a user
   */
  private updateActivity(userId: string): void {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return;

    const now = new Date();
    for (const [, connection] of userConnections) {
      // Create new connection info with updated timestamp
      const updated: ConnectionInfo = {
        ...connection,
        lastActivityAt: now,
      };
      userConnections.set(connection.connectionId, updated);
    }
  }

  /**
   * Find the oldest connection in a map (for LRU eviction)
   */
  private findOldestConnection(
    connections: Map<string, ConnectionInfo>,
  ): string | null {
    let oldest: { id: string; timestamp: Date } | null = null;

    for (const [id, info] of connections) {
      if (!oldest || info.connectedAt < oldest.timestamp) {
        oldest = { id, timestamp: info.connectedAt };
      }
    }

    return oldest?.id ?? null;
  }

  /**
   * Clean up stale connections
   *
   * @param maxIdleMs - Maximum idle time before cleanup (default: 5 minutes)
   * @returns Number of connections cleaned up
   */
  cleanupStaleConnections(maxIdleMs: number = 5 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, connections] of this.connections) {
      for (const [connectionId, info] of connections) {
        const idleTime = now - info.lastActivityAt.getTime();
        if (idleTime > maxIdleMs) {
          connections.delete(connectionId);
          cleaned++;
        }
      }

      // Remove user if no connections remain
      if (connections.size === 0) {
        this.connections.delete(userId);
        this.lastLocationUpdate.delete(userId);
      }
    }

    return cleaned;
  }

  /**
   * Clear all connections (for testing/emergency)
   */
  clear(): void {
    this.connections.clear();
    this.lastLocationUpdate.clear();
  }
}
