import { Context, Effect } from "effect";

/**
 * PubSubService - Publish/Subscribe Port Interface
 *
 * This interface defines pub/sub operations needed by the use cases layer
 * for GraphQL subscriptions. It abstracts the pub/sub mechanism, allowing
 * different implementations (EventEmitter, Redis Pub/Sub, etc.) in the adapters layer.
 *
 * Key Design Decisions:
 * - Uses AsyncIterable pattern for GraphQL subscription compatibility
 * - Type-safe with generic payload types
 * - No framework dependencies (pure TypeScript interface)
 * - Simple subscribe/publish/unsubscribe API
 *
 * Implementations:
 * - EventEmitterPubSub: In-memory using Node.js EventEmitter
 * - RedisPubSub: Distributed using Redis (future)
 * - InMemoryPubSub: For testing
 *
 * @module ports
 */

// =============================================================================
// Domain Errors
// =============================================================================

/**
 * Base error for pub/sub operation failures
 */
export class PubSubError extends Error {
  readonly _tag = "PubSubError" as const;
  readonly code = "PUBSUB_ERROR" as const;
  override readonly message: string;

  constructor(props: { message: string }) {
    super(props.message);
    this.message = props.message;
  }
}

/**
 * Error thrown when subscription to a channel fails
 */
export class SubscriptionFailedError extends Error {
  readonly _tag = "SubscriptionFailedError" as const;
  readonly code = "SUBSCRIPTION_FAILED" as const;
  readonly channel: string;
  override readonly message: string;

  constructor(props: { message: string; channel: string }) {
    super(props.message);
    this.message = props.message;
    this.channel = props.channel;
  }
}

/**
 * Error thrown when publishing to a channel fails
 */
export class PublishFailedError extends Error {
  readonly _tag = "PublishFailedError" as const;
  readonly code = "PUBLISH_FAILED" as const;
  readonly channel: string;
  override readonly message: string;

  constructor(props: { message: string; channel: string }) {
    super(props.message);
    this.message = props.message;
    this.channel = props.channel;
  }
}

// =============================================================================
// Subscription Handle
// =============================================================================

/**
 * Handle returned from subscribe() that allows unsubscribing
 */
export interface SubscriptionHandle {
  /**
   * Unsubscribe from the channel
   * Stops the async iterable and cleans up resources
   */
  unsubscribe(): void;

  /**
   * The channel this subscription is for
   */
  readonly channel: string;
}

// =============================================================================
// Port Interface
// =============================================================================

/**
 * PubSubService defines the contract for publish/subscribe operations
 *
 * This port abstracts the pub/sub mechanism from the use cases,
 * enabling different implementations without changing business logic.
 *
 * The subscribe method returns an AsyncIterable, making it compatible
 * with GraphQL subscriptions using the async generator pattern.
 */
export interface PubSubService {
  /**
   * Subscribe to a channel and receive messages as an async iterable
   *
   * This method returns an AsyncIterable that yields messages published
   * to the specified channel. It's designed to work with GraphQL subscriptions
   * using the async generator pattern.
   *
   * @param channel - The channel name to subscribe to (e.g., "activity:feed:trip-123")
   * @returns An object containing the async iterable and unsubscribe function
   *
   * @example
   * ```typescript
   * const subscription = pubSubService.subscribe<Activity>("activity:feed:trip-123");
   *
   * // Use with GraphQL subscription resolver
   * async function* activityFeedResolver() {
   *   for await (const activity of subscription.asyncIterable) {
   *     yield activity;
   *   }
   * }
   *
   * // Clean up when done
   * subscription.unsubscribe();
   * ```
   */
  subscribe<T>(channel: string): {
    asyncIterable: AsyncIterable<T>;
    unsubscribe: () => void;
  };

  /**
   * Publish a message to a channel
   *
   * All subscribers to the channel will receive the message.
   * This method is synchronous and returns immediately.
   *
   * @param channel - The channel name to publish to
   * @param payload - The message payload to send
   * @throws PublishFailedError if publishing fails
   *
   * @example
   * ```typescript
   * const activity: Activity = { id: "act-123", type: "POST_CREATED", ... };
   * pubSubService.publish("activity:feed:trip-123", activity);
   * ```
   */
  publish<T>(channel: string, payload: T): void;

  /**
   * Unsubscribe from a specific channel
   *
   * This stops all subscriptions to the channel and cleans up resources.
   *
   * @param channel - The channel name to unsubscribe from
   *
   * @example
   * ```typescript
   * pubSubService.unsubscribe("activity:feed:trip-123");
   * ```
   */
  unsubscribe(channel: string): void;

  /**
   * Unsubscribe all subscriptions and clean up resources
   *
   * This is useful for testing and graceful shutdown.
   */
  unsubscribeAll(): void;
}

/**
 * PubSubService Context.Tag for Effect dependency injection
 */
export class PubSubServiceTag extends Context.Tag("PubSubService")<
  PubSubServiceTag,
  {
    subscribe: <T>(channel: string) => {
      asyncIterable: AsyncIterable<T>;
      unsubscribe: () => void;
    };
    publish: <T>(channel: string, payload: T) => void;
    unsubscribe: (channel: string) => void;
    unsubscribeAll: () => void;
  }
>() {}
