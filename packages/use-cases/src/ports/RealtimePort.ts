/**
 * RealtimePort - Real-time Communication Port Interface
 *
 * This interface defines real-time operations needed by the use cases layer.
 * It abstracts the WebSocket/subscription mechanism, allowing different implementations
 * (Supabase Realtime, custom WebSocket, Server-Sent Events, etc.) in the adapters layer.
 *
 * Key Design Decisions:
 * - Uses Effect type for explicit error handling and composability
 * - Abstracts WebSocket implementation details
 * - Supports subscriptions, broadcasts, and presence tracking
 * - No framework dependencies (pure TypeScript interface)
 * - Operations return Effect for better composability
 *
 * Implementations:
 * - SupabaseRealtimeAdapter: Uses Supabase Realtime
 * - InMemoryRealtimeAdapter: For testing and local development
 * - CustomWebSocketAdapter: Custom WebSocket implementation
 *
 * @module ports
 */

import { Context, Effect } from "effect";

// =============================================================================
// Domain Errors
// =============================================================================

/**
 * Base error for real-time operation failures
 */
export class RealtimeError extends Error {
  readonly _tag = "RealtimeError" as const;
  readonly code = "REALTIME_ERROR" as const;
  override readonly message: string;

  constructor(props: { message: string }) {
    super(props.message);
    this.message = props.message;
  }
}

/**
 * Error thrown when connection fails or is lost
 */
export class ConnectionError extends Error {
  readonly _tag = "ConnectionError" as const;
  readonly code = "CONNECTION_ERROR" as const;
  readonly channel?: string;
  override readonly message: string;

  constructor(props: { message: string; channel?: string }) {
    super(props.message);
    this.message = props.message;
    this.channel = props.channel;
  }
}

/**
 * Error thrown when subscription is invalid or fails
 */
export class SubscriptionError extends Error {
  readonly _tag = "SubscriptionError" as const;
  readonly code = "SUBSCRIPTION_ERROR" as const;
  readonly channel: string;
  override readonly message: string;

  constructor(props: { message: string; channel: string }) {
    super(props.message);
    this.message = props.message;
    this.channel = props.channel;
  }
}

// =============================================================================
// Domain Types
// =============================================================================

/**
 * Connection state for real-time channels
 */
export type ConnectionState =
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "RECONNECTING"
  | "CLOSED";

/**
 * Configuration for a channel subscription
 */
export interface ChannelConfig {
  /** Event types to listen for */
  events?: string[];
  /** Filter pattern for messages (implementation-specific) */
  filter?: string;
  /** Callback for receiving messages */
  onMessage?: (event: string, payload: unknown) => void;
  /** Callback for connection state changes */
  onConnectionChange?: (state: ConnectionState) => void;
}

/**
 * Subscription handle for managing a channel subscription
 */
export interface RealtimeSubscription {
  /** Unique identifier for this subscription */
  readonly id: string;
  /** Channel name */
  readonly channel: string;
  /** Current connection state */
  readonly state: ConnectionState;
  /** Unsubscribe from the channel */
  unsubscribe(): Effect.Effect<void, RealtimeError, never>;
}

/**
 * Presence state for tracking user presence in channels
 */
export interface PresenceState {
  /** User identifier */
  userId: string;
  /** Custom presence data */
  payload?: Record<string, unknown>;
  /** Timestamp when presence was set */
  timestamp?: Date;
}

// =============================================================================
// Port Interface
// =============================================================================

/**
 * RealtimePort defines the contract for real-time communication operations
 *
 * This port abstracts the WebSocket/subscription mechanism from the use cases,
 * enabling different implementations without changing business logic.
 */
export interface RealtimePort {
  /**
   * Subscribe to a channel for real-time updates
   *
   * @param channel - The channel name to subscribe to
   * @param config - Configuration for the subscription
   * @returns Effect.Effect<RealtimeSubscription, RealtimeError | SubscriptionError, never>
   *
   * @example
   * ```typescript
   * const effect = realtimePort.subscribe("notifications:user-123", {
   *   events: ["new_notification"],
   *   onMessage: (event, payload) => {
   *     console.log(`Received ${event}:`, payload);
   *   }
   * });
   *
   * const subscription = await Effect.runPromise(effect);
   * // Store subscription for later cleanup
   * ```
   */
  subscribe(
    channel: string,
    config: ChannelConfig,
  ): Effect.Effect<
    RealtimeSubscription,
    RealtimeError | SubscriptionError,
    never
  >;

  /**
   * Broadcast a message to all subscribers of a channel
   *
   * @param channel - The channel name to broadcast to
   * @param event - The event type/name
   * @param payload - The message payload
   * @returns Effect.Effect<void, RealtimeError, never>
   *
   * @example
   * ```typescript
   * const effect = realtimePort.broadcast(
   *   "challenge:challenge-456",
   *   "submission_received",
   *   { submissionId: "sub-789", userId: "user-123" }
   * );
   *
   * await Effect.runPromise(effect);
   * console.log("Broadcast successful");
   * ```
   */
  broadcast(
    channel: string,
    event: string,
    payload: unknown,
  ): Effect.Effect<void, RealtimeError, never>;

  /**
   * Track presence state for the current user in a channel
   *
   * @param channel - The channel name
   * @param state - The presence state to track
   * @returns Effect.Effect<void, RealtimeError, never>
   *
   * @example
   * ```typescript
   * const effect = realtimePort.trackPresence(
   *   "trip:trip-789",
   *   { userId: "user-123", payload: { location: { lat: 40.7, lng: -74 } } }
   * );
   *
   * await Effect.runPromise(effect);
   * console.log("Presence tracked");
   * ```
   */
  trackPresence(
    channel: string,
    state: PresenceState,
  ): Effect.Effect<void, RealtimeError, never>;

  /**
   * Get the current connection state
   *
   * @returns The current connection state
   *
   * @example
   * ```typescript
   * const state = realtimePort.getConnectionState();
   * if (state === "CONNECTED") {
   *   // Safe to subscribe/broadcast
   * }
   * ```
   */
  getConnectionState(): ConnectionState;
}

/**
 * RealtimePort Context.Tag for Effect dependency injection
 */
export class RealtimePortTag extends Context.Tag("RealtimePort")<
  RealtimePortTag,
  {
    subscribe: (
      channel: string,
      config: ChannelConfig,
    ) => Effect.Effect<
      RealtimeSubscription,
      RealtimeError | SubscriptionError,
      never
    >;
    broadcast: (
      channel: string,
      event: string,
      payload: unknown,
    ) => Effect.Effect<void, RealtimeError, never>;
    trackPresence: (
      channel: string,
      state: PresenceState,
    ) => Effect.Effect<void, RealtimeError, never>;
    getConnectionState: () => ConnectionState;
  }
>() {}
