import type { Effect } from "effect";

/**
 * RealtimePort - Real-time Communication Port Interface
 *
 * This interface defines real-time operations needed by the use cases layer.
 * It abstracts the WebSocket/subscription mechanism, allowing different implementations
 * (Supabase Realtime, custom WebSocket, Server-Sent Events, etc.) in the adapters layer.
 */

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
  unsubscribe(): Effect.Effect<void, RealtimeError | ConnectionError, never>;
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
 */
export interface RealtimePort {
  /**
   * Subscribe to a channel for real-time updates
   */
  subscribe(
    channel: string,
    config: ChannelConfig,
  ): Effect.Effect<
    RealtimeSubscription,
    RealtimeError | ConnectionError | SubscriptionError,
    never
  >;

  /**
   * Broadcast a message to all subscribers of a channel
   */
  broadcast(
    channel: string,
    event: string,
    payload: unknown,
  ): Effect.Effect<
    void,
    RealtimeError | ConnectionError | SubscriptionError,
    never
  >;

  /**
   * Track presence state for the current user in a channel
   */
  trackPresence(
    channel: string,
    state: PresenceState,
  ): Effect.Effect<
    void,
    RealtimeError | ConnectionError | SubscriptionError,
    never
  >;

  /**
   * Get the current connection state
   */
  getConnectionState(): ConnectionState;
}
