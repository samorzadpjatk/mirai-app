import type { Effect } from "effect";

/**
 * PubSubService - Publish/Subscribe Port Interface
 *
 * This interface defines pub/sub operations needed by the use cases layer
 * for GraphQL subscriptions. It abstracts the pub/sub mechanism, allowing
 * different implementations (EventEmitter, Redis Pub/Sub, etc.) in the adapters layer.
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
 */
export interface PubSubService {
  /**
   * Subscribe to a channel and receive messages as an async iterable
   */
  subscribe<T>(channel: string): {
    asyncIterable: AsyncIterable<T>;
    unsubscribe: () => void;
  };

  /**
   * Publish a message to a channel
   */
  publish<T>(channel: string, payload: T): void;

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channel: string): void;

  /**
   * Unsubscribe all subscriptions and clean up resources
   */
  unsubscribeAll(): void;
}
