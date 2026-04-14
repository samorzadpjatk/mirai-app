/**
 * InMemoryRealtimeAdapter - In-memory implementation of RealtimePort for testing
 *
 * This adapter provides an in-memory implementation of the RealtimePort interface
 * suitable for unit testing without external services. It simulates WebSocket
 * behavior using local event emitters and maintains all subscriptions in memory.
 *
 * Key Design Decisions:
 * - Pure in-memory implementation - no external dependencies
 * - Synchronous operations where possible for faster tests
 * - Thread-safe for single-process tests (Bun test runner)
 * - Supports broadcast, subscribe, and presence operations
 * - Compatible with awilix-modular dependency injection
 *
 * @module gateways
 */

import {
  type RealtimePort,
  type RealtimeSubscription,
  type ChannelConfig,
  type PresenceState,
  type ConnectionState,
  RealtimeError,
  SubscriptionError,
} from "@mirai-app/use-cases/ports/RealtimePort";
import { Effect } from "effect";

// =============================================================================
// Subscription Implementation
// =============================================================================

/**
 * Internal subscription implementation for in-memory channels
 */
class InMemoryRealtimeSubscription implements RealtimeSubscription {
  readonly id: string;
  readonly channel: string;
  private _state: ConnectionState = "CONNECTED";
  private readonly cleanup: () => void;

  constructor(id: string, channel: string, cleanup: () => void) {
    this.id = id;
    this.channel = channel;
    this.cleanup = cleanup;
  }

  get state(): ConnectionState {
    return this._state;
  }

  setState(state: ConnectionState): void {
    this._state = state;
  }

  unsubscribe(): Effect.Effect<void, RealtimeError, never> {
    return Effect.sync(() => {
      this._state = "CLOSED";
      this.cleanup();
    }).pipe(
      Effect.catchAll((error) =>
        Effect.fail(
          new RealtimeError({
            message: `Failed to unsubscribe: ${error instanceof Error ? error.message : "Unknown error"}`,
          }),
        ),
      ),
    );
  }
}

// =============================================================================
// InMemoryRealtimeAdapter
// =============================================================================

/**
 * InMemoryRealtimeAdapter
 *
 * In-memory implementation of RealtimePort for testing purposes.
 * Simulates real-time communication without external dependencies.
 *
 * Compatible with awilix-modular dependency injection.
 *
 * @example
 * ```typescript
 * // In test setup
 * const container = createTestContainer();
 * container.register({
 *   realtimePort: asClass(InMemoryRealtimeAdapter).singleton(),
 * });
 *
 * // Use in tests
 * const realtimePort = container.resolve<InMemoryRealtimeAdapter>("realtimePort");
 *
 * // Subscribe to channel
 * const program = realtimePort.subscribe("test-channel", {
 *   onMessage: (event, payload) => console.log(event, payload)
 * });
 *
 * const subscription = await Effect.runPromise(program);
 *
 * // Broadcast message
 * await Effect.runPromise(realtimePort.broadcast("test-channel", "test-event", { data: "value" }));
 *
 * // Verify message was received
 * expect(receivedMessages).toHaveLength(1);
 * ```
 */
export class InMemoryRealtimeAdapter implements RealtimePort {
  private subscriptions: Map<string, InMemoryRealtimeSubscription[]> =
    new Map();
  private channelConfigs: Map<string, ChannelConfig[]> = new Map();
  private presenceData: Map<string, Map<string, PresenceState>> = new Map();
  private subscriptionCounter = 0;
  private globalState: ConnectionState = "CONNECTED";

  /**
   * Subscribe to a channel for real-time updates
   *
   * Creates an in-memory subscription that can receive broadcast messages.
   */
  subscribe(
    channel: string,
    config: ChannelConfig,
  ): Effect.Effect<
    RealtimeSubscription,
    RealtimeError | SubscriptionError,
    never
  > {
    return Effect.sync(() => {
      // Check if we're in a state that allows subscriptions
      if (this.globalState === "CLOSED") {
        throw new SubscriptionError({
          message: "Cannot subscribe: adapter is closed",
          channel,
        });
      }

      // Generate subscription ID
      this.subscriptionCounter++;
      const subscriptionId = `inmem-sub-${this.subscriptionCounter}`;

      // Create cleanup function
      const cleanup = () => {
        this.removeSubscription(channel, subscriptionId);
      };

      // Create subscription
      const subscription = new InMemoryRealtimeSubscription(
        subscriptionId,
        channel,
        cleanup,
      );

      // Store subscription
      if (!this.subscriptions.has(channel)) {
        this.subscriptions.set(channel, []);
        this.channelConfigs.set(channel, []);
      }

      this.subscriptions.get(channel)!.push(subscription);
      this.channelConfigs.get(channel)!.push(config);

      // Notify connection change
      config.onConnectionChange?.("CONNECTED");

      return subscription;
    }).pipe(
      Effect.catchAllDefect((error) => {
        if (error instanceof SubscriptionError) {
          return Effect.fail(error);
        }
        return Effect.fail(
          new SubscriptionError({
            message: `Subscription failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            channel,
          }),
        );
      }),
    );
  }

  /**
   * Broadcast a message to all subscribers of a channel
   *
   * Delivers messages to all active subscribers.
   */
  broadcast(
    channel: string,
    event: string,
    payload: unknown,
  ): Effect.Effect<void, RealtimeError, never> {
    return Effect.tryPromise({
      try: async () => {
        const channelSubscriptions = this.subscriptions.get(channel);
        const channelConfigs = this.channelConfigs.get(channel);

        if (!channelSubscriptions || !channelConfigs) {
          // No subscribers - this is not an error, just a no-op
          return;
        }

        // Deliver to all subscribers
        for (let i = 0; i < channelSubscriptions.length; i++) {
          const subscription = channelSubscriptions[i];
          const config = channelConfigs[i];

          // Skip closed subscriptions
          if (subscription.state === "CLOSED") {
            continue;
          }

          // Check if event is in the configured events list (if specified)
          if (config.events && config.events.length > 0) {
            if (!config.events.includes(event)) {
              continue;
            }
          }

          // Deliver message
          try {
            config.onMessage?.(event, payload);
          } catch (error) {
            // Log but don't fail - other subscribers should still receive
            console.warn(
              `Message handler error for subscription ${subscription.id}:`,
              error,
            );
          }
        }
      },
      catch: (error) =>
        new RealtimeError({
          message: `Broadcast failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
    });
  }

  /**
   * Track presence state for the current user in a channel
   *
   * Stores presence data in memory for later retrieval.
   */
  trackPresence(
    channel: string,
    state: PresenceState,
  ): Effect.Effect<void, RealtimeError, never> {
    return Effect.tryPromise({
      try: async () => {
        if (!this.presenceData.has(channel)) {
          this.presenceData.set(channel, new Map());
        }

        const channelPresence = this.presenceData.get(channel)!;
        channelPresence.set(state.userId, {
          ...state,
          timestamp: state.timestamp ?? new Date(),
        });
      },
      catch: (error) =>
        new RealtimeError({
          message: `Presence tracking failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
    });
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): ConnectionState {
    return this.globalState;
  }

  /**
   * Set the global connection state (for testing connection failures)
   */
  setConnectionState(state: ConnectionState): void {
    this.globalState = state;

    // Notify all subscribers of state change
    for (const [channel, configs] of this.channelConfigs) {
      for (const config of configs) {
        config.onConnectionChange?.(state);
      }
    }
  }

  /**
   * Get presence data for a channel (for testing verification)
   */
  getPresenceData(channel: string): Map<string, PresenceState> | undefined {
    return this.presenceData.get(channel);
  }

  /**
   * Get all subscribers for a channel (for testing verification)
   */
  getSubscribers(channel: string): RealtimeSubscription[] {
    return this.subscriptions.get(channel) ?? [];
  }

  /**
   * Clear all subscriptions and presence data (for test cleanup)
   */
  clear(): void {
    // Close all subscriptions
    for (const [, subs] of this.subscriptions) {
      for (const sub of subs) {
        sub.setState("CLOSED");
      }
    }

    this.subscriptions.clear();
    this.channelConfigs.clear();
    this.presenceData.clear();
    this.globalState = "CONNECTED";
  }

  /**
   * Remove a specific subscription
   */
  private removeSubscription(channel: string, subscriptionId: string): void {
    const channelSubs = this.subscriptions.get(channel);
    const channelConfigs = this.channelConfigs.get(channel);

    if (channelSubs && channelConfigs) {
      const index = channelSubs.findIndex((sub) => sub.id === subscriptionId);
      if (index !== -1) {
        channelSubs.splice(index, 1);
        channelConfigs.splice(index, 1);

        // Clean up empty channels
        if (channelSubs.length === 0) {
          this.subscriptions.delete(channel);
          this.channelConfigs.delete(channel);
        }
      }
    }
  }
}
