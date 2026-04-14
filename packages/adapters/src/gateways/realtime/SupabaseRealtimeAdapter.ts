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
 * - Compatible with awilix-modular dependency injection
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
} from "@mirai-app/use-cases/ports/RealtimePort";
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
      });
    }

    // Generic realtime error
    return new RealtimeError({
      message: `${operation} failed: ${error.message}`,
    });
  }

  // Unknown error type
  return new RealtimeError({
    message: `Unknown ${operation} error occurred`,
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
    case "connecting":
      return "CONNECTING";
    case "open":
      return "CONNECTED";
    case "closed":
      return "CLOSED";
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
    const supabaseState = this.supabaseChannel
      .state as (typeof REALTIME_CHANNEL_STATES)[keyof typeof REALTIME_CHANNEL_STATES];
    return mapSupabaseStateToConnectionState(supabaseState);
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
 * Compatible with awilix-modular dependency injection.
 * Registered in the DI module with scoped lifetime.
 *
 * @example
 * ```typescript
 * // With DI container (awilix-modular)
 * const realtimePort = container.resolve("realtimePort");
 * const result = realtimePort.subscribe("notifications:user-123", {
 *   onMessage: (event, payload) => logger.debug("Received realtime message", { event, payload })
 * });
 *
 * // Manual instantiation (backward-compatible)
 * const realtimePort = new SupabaseRealtimeAdapter(supabaseClient);
 * ```
 */
export class SupabaseRealtimeAdapter implements RealtimePort {
  private activeChannels: Map<string, RealtimeChannel> = new Map();
  private subscriptionCounter = 0;

  /**
   * Creates a new SupabaseRealtimeAdapter
   *
   * @param supabase - SupabaseClient instance (injected by awilix or passed manually)
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
    RealtimeError | SubscriptionError,
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
        const subscription = new SupabaseRealtimeSubscription(
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
  ): Effect.Effect<void, RealtimeError, never> {
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
        const { error } = await supabaseChannel.send({
          type: "broadcast",
          event,
          payload,
        });

        if (error) {
          throw new RealtimeError({ message: error.message });
        }

        return undefined;
      },
      catch: (error) => {
        if (error instanceof RealtimeError) {
          return error;
        }
        return mapSupabaseErrorToRealtimeError(error, "broadcast", channel);
      },
    });
  }

  /**
   * Track presence state for the current user in a channel
   *
   * Uses Supabase's presence tracking to broadcast user state to channel members.
   */
  trackPresence(
    channel: string,
    state: PresenceState,
  ): Effect.Effect<void, RealtimeError, never> {
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

        const { error } = await supabaseChannel.track(presenceData);

        if (error) {
          throw new RealtimeError({ message: error.message });
        }

        return undefined;
      },
      catch: (error) => {
        if (error instanceof RealtimeError) {
          return error;
        }
        return mapSupabaseErrorToRealtimeError(error, "trackPresence", channel);
      },
    });
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
    let hasReconnecting = false;

    for (const [, channel] of this.activeChannels) {
      const state =
        channel.state as (typeof REALTIME_CHANNEL_STATES)[keyof typeof REALTIME_CHANNEL_STATES];

      if (state === "open") {
        return "CONNECTED";
      } else if (state === "connecting") {
        hasConnecting = true;
      } else if (state === "closed") {
        hasReconnecting = true;
      }
    }

    if (hasConnecting) return "CONNECTING";
    if (hasReconnecting) return "RECONNECTING";
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
