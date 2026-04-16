/**
 * SupabaseRealtimeAdapter - RealtimePort implementation using Supabase Realtime
 *
 * This adapter implements the RealtimePort interface using Supabase Realtime
 * for WebSocket-based real-time communication. It wraps the Supabase realtime
 * client and maps Supabase-specific operations to the domain port interface.
 *
 * Key Design Decisions:
 * - Uses Result type for explicit error handling (no exceptions for expected errors)
 * - Maps Supabase realtime errors to domain RealtimeError types
 * - Thin wrapper with no business logic (just mapping)
 * - Compatible with Effect Layers for dependency injection
 *
 * @module gateways
 */

import type {
  SupabaseClient,
  RealtimeChannel,
  REALTIME_CHANNEL_STATES,
} from "@mirai-app/frameworks/supabase";
import {
  type RealtimePort,
  type RealtimeSubscription,
  type ChannelConfig,
  type PresenceState,
  type ConnectionState,
  RealtimeError,
  ConnectionError,
  SubscriptionError,
} from "@mirai-app/use-cases";
import { Effect } from "effect";

// =============================================================================
// Error Mapping
// =============================================================================

/**
 * Maps Supabase realtime errors to domain RealtimeError types
 */
function mapSupabaseErrorToRealtimeError(
  error: unknown,
  operation: string,
  channel?: string,
): RealtimeError | ConnectionError | SubscriptionError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Connection-related errors
    if (
      message.includes("connection") ||
      message.includes("websocket") ||
      message.includes("network") ||
      message.includes("timeout")
    ) {
      return new ConnectionError({
        message: `Connection failed during ${operation}: ${error.message}`,
        channel,
        code: "CONNECTION_ERROR",
      });
    }

    // Subscription-related errors
    if (
      message.includes("subscription") ||
      message.includes("channel") ||
      message.includes("topic")
    ) {
      return new SubscriptionError({
        message: `Subscription failed during ${operation}: ${error.message}`,
        channel: channel ?? "unknown",
        code: "SUBSCRIPTION_ERROR",
      });
    }

    // Generic realtime error
    return new RealtimeError({
      message: `${operation} failed: ${error.message}`,
      code: "REALTIME_ERROR",
    });
  }

  // Unknown error type
  return new RealtimeError({
    message: `Unknown ${operation} error occurred`,
    code: "REALTIME_ERROR",
  });
}

// =============================================================================
// Connection State Mapping
// =============================================================================

/**
 * Maps Supabase channel state to domain ConnectionState
 */
function mapSupabaseStateToConnectionState(
  supabaseState: (typeof REALTIME_CHANNEL_STATES)[keyof typeof REALTIME_CHANNEL_STATES],
): ConnectionState {
  switch (supabaseState) {
    case "closed":
      return "CLOSED";
    case "joined":
      return "CONNECTED";
    case "joining":
      return "CONNECTING";
    case "leaving":
      return "DISCONNECTED";
    case "errored":
      return "DISCONNECTED";
    default:
      return "DISCONNECTED";
  }
}

// =============================================================================
// Subscription Implementation
// =============================================================================

/**
 * Internal subscription implementation wrapping Supabase RealtimeChannel
 */
class SupabaseRealtimeSubscription implements RealtimeSubscription {
  readonly id: string;
  readonly channel: string;

  constructor(
    private readonly supabaseChannel: RealtimeChannel,
    channelName: string,
    private readonly subscriptionId: string,
  ) {
    this.channel = channelName;
    this.id = subscriptionId;
  }

  get state(): ConnectionState {
    // Access the internal state from Supabase channel
    // The state property may vary based on Supabase client version
    const rawState = this.supabaseChannel.state as string | undefined;
    if (!rawState) return "DISCONNECTED";

    // Map string state to ConnectionState
    switch (rawState) {
      case "connecting":
      case "joining":
        return "CONNECTING";
      case "open":
      case "joined":
        return "CONNECTED";
      case "closed":
        return "CLOSED";
      case "leaving":
        return "DISCONNECTED";
      case "errored":
        return "DISCONNECTED";
      default:
        return "DISCONNECTED";
    }
  }

  unsubscribe(): Effect.Effect<void, RealtimeError, never> {
    return Effect.try({
      try: () => {
        this.supabaseChannel.unsubscribe();
        return undefined;
      },
      catch: (error) =>
        new RealtimeError({
          message: `Failed to unsubscribe from channel ${this.channel}: ${error instanceof Error ? error.message : "Unknown error"}`,
          code: "REALTIME_ERROR",
        }),
    });
  }
}

// =============================================================================
// SupabaseRealtimeAdapter
// =============================================================================

/**
 * SupabaseRealtimeAdapter
 *
 * Implements RealtimePort using Supabase Realtime for WebSocket-based
 * real-time communication, subscriptions, and presence tracking.
 *
 * Compatible with Effect Layers.
 *
 * @example
 * ```typescript
 * // Direct instantiation
 * const realtimePort = new SupabaseRealtimeAdapter(supabaseClient);
 * const result = realtimePort.subscribe("notifications:user-123", {
 *   onMessage: (event, payload) => logger.debug("Received realtime message", { event, payload })
 * });
 * ```
 */
export class SupabaseRealtimeAdapter implements RealtimePort {
  private activeChannels: Map<string, RealtimeChannel> = new Map();
  private subscriptionCounter = 0;

  /**
   * Creates a new SupabaseRealtimeAdapter
   *
   * @param supabase - SupabaseClient instance
   */
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Subscribe to a channel for real-time updates
   *
   * Creates a Supabase realtime channel and sets up event listeners
   * based on the provided configuration.
   */
  subscribe(
    channel: string,
    config: ChannelConfig,
  ): Effect.Effect<
    RealtimeSubscription,
    RealtimeError | ConnectionError | SubscriptionError,
    never
  > {
    return Effect.try({
      try: () => {
        // Create the Supabase channel
        const supabaseChannel = this.supabase.channel(channel);

        // Set up event listeners if events are specified
        if (config.events && config.events.length > 0) {
          for (const event of config.events) {
            supabaseChannel.on(
              "broadcast",
              { event },
              (payload: { event: string; payload: unknown }) => {
                config.onMessage?.(payload.event, payload.payload);
              },
            );
          }
        }

        // Subscribe to the channel
        supabaseChannel.subscribe((status: string) => {
          const state = this.mapSupabaseStatusToConnectionState(status);
          config.onConnectionChange?.(state);
        });

        // Store the channel for later management
        this.activeChannels.set(channel, supabaseChannel);

        // Generate subscription ID
        this.subscriptionCounter++;
        const subscriptionId = `sub-${this.subscriptionCounter}`;

        // Create and return subscription wrapper
        const subscription: RealtimeSubscription =
          new SupabaseRealtimeSubscription(
            supabaseChannel,
            channel,
            subscriptionId,
          );

        return subscription;
      },
      catch: (error) =>
        mapSupabaseErrorToRealtimeError(error, "subscribe", channel),
    });
  }

  /**
   * Broadcast a message to all subscribers of a channel
   *
   * Uses Supabase's broadcast API to send messages to channel subscribers.
   */
  broadcast(
    channel: string,
    event: string,
    payload: unknown,
  ): Effect.Effect<
    void,
    RealtimeError | ConnectionError | SubscriptionError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        // Get or create the channel
        let supabaseChannel = this.activeChannels.get(channel);

        if (!supabaseChannel) {
          supabaseChannel = this.supabase.channel(channel);
          this.activeChannels.set(channel, supabaseChannel);

          // Subscribe first to enable broadcasting
          await new Promise<void>((resolve, reject) => {
            supabaseChannel!.subscribe((status: string) => {
              if (status === "SUBSCRIBED") {
                resolve();
              } else if (status === "CHANNEL_ERROR") {
                reject(new Error("Channel subscription failed"));
              }
            });
          });
        }

        // Send the broadcast message
        const response = await supabaseChannel.send({
          type: "broadcast",
          event,
          payload,
        });

        // Check for error in response - handle both object formats
        const responseError = (
          response as { error?: { message: string } } | undefined
        )?.error;
        if (responseError) {
          throw new RealtimeError({
            message: responseError.message,
            code: "REALTIME_ERROR",
          });
        }

        return undefined;
      },
      catch: (error) => {
        // Check for tagged error by _tag property (Data.TaggedError pattern)
        const taggedError = error as { _tag?: string };
        if (taggedError._tag === "RealtimeError") {
          return error as RealtimeError;
        }
        return mapSupabaseErrorToRealtimeError(error, "broadcast", channel);
      },
    }).pipe(Effect.map(() => undefined));
  }

  /**
   * Track presence state for the current user in a channel
   *
   * Uses Supabase's presence tracking to broadcast user state to channel members.
   */
  trackPresence(
    channel: string,
    state: PresenceState,
  ): Effect.Effect<
    void,
    RealtimeError | ConnectionError | SubscriptionError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        // Get or create the channel
        let supabaseChannel = this.activeChannels.get(channel);

        if (!supabaseChannel) {
          supabaseChannel = this.supabase.channel(channel);
          this.activeChannels.set(channel, supabaseChannel);

          // Subscribe to enable presence tracking
          await new Promise<void>((resolve, reject) => {
            supabaseChannel!.subscribe((status: string) => {
              if (status === "SUBSCRIBED") {
                resolve();
              } else if (status === "CHANNEL_ERROR") {
                reject(new Error("Channel subscription failed"));
              }
            });
          });
        }

        // Track presence
        const presenceData = {
          userId: state.userId,
          ...state.payload,
          timestamp: state.timestamp?.toISOString() ?? new Date().toISOString(),
        };

        const response = await supabaseChannel.track(presenceData);

        // Check for error in response - handle both object formats
        const responseError = (
          response as { error?: { message: string } } | undefined
        )?.error;
        if (responseError) {
          throw new RealtimeError({
            message: responseError.message,
            code: "REALTIME_ERROR",
          });
        }

        return undefined;
      },
      catch: (error) => {
        // Check for tagged error by _tag property (Data.TaggedError pattern)
        const taggedError = error as { _tag?: string };
        if (taggedError._tag === "RealtimeError") {
          return error as RealtimeError;
        }
        return mapSupabaseErrorToRealtimeError(error, "trackPresence", channel);
      },
    }).pipe(Effect.map(() => undefined));
  }

  /**
   * Get the current connection state
   *
   * Returns the aggregate state of all active channels.
   * If any channel is connected, returns CONNECTED.
   * If no channels exist, returns CLOSED.
   */
  getConnectionState(): ConnectionState {
    if (this.activeChannels.size === 0) {
      return "CLOSED";
    }

    let hasConnecting = false;
    let hasClosed = false;

    for (const [, channel] of this.activeChannels) {
      const rawState = channel.state as string | undefined;
      const state = mapSupabaseStateToConnectionState(
        rawState as (typeof REALTIME_CHANNEL_STATES)[keyof typeof REALTIME_CHANNEL_STATES],
      );

      if (state === "CONNECTED") {
        return "CONNECTED";
      } else if (state === "CONNECTING") {
        hasConnecting = true;
      } else if (state === "CLOSED") {
        hasClosed = true;
      }
    }

    if (hasConnecting) return "CONNECTING";
    if (hasClosed) return "CLOSED";
    return "DISCONNECTED";
  }

  /**
   * Map Supabase status string to domain ConnectionState
   */
  private mapSupabaseStatusToConnectionState(status: string): ConnectionState {
    switch (status) {
      case "SUBSCRIBED":
        return "CONNECTED";
      case "CLOSED":
        return "CLOSED";
      case "CHANNEL_ERROR":
        return "DISCONNECTED";
      default:
        return "CONNECTING";
    }
  }
}
