import type { Effect } from "effect";
import type { IPortError } from "../errors/ports";
import type { IDomainEvent } from "./DomainEvent";

/**
 * IEventBusPort - Transport-agnostic event bus contract
 *
 * Defines the interface for publishing and subscribing to domain events.
 * Implementations can use Redis, PostgreSQL NOTIFY, or in-memory mechanisms.
 * The abstraction ensures business logic remains independent of transport details.
 *
 * Design decisions:
 * - Generic publish/subscribe with type-safe event handling
 * - Effect-based for composable error handling and cancellation
 * - No dependencies in return channel (never) - error handling is internal
 *
 * @example
 * ```typescript
 * // Publishing an event
 * const program = Effect.gen(function* () {
 *   const eventBus = yield* EventBusTag;
 *   const event = new NotificationCreated(...);
 *   yield* eventBus.publish(event);
 * });
 *
 * // Subscribing to events
 * const subscription = Effect.gen(function* () {
 *   const eventBus = yield* EventBusTag;
 *   const { unsubscribe } = yield* eventBus.subscribe(
 *     "NotificationCreated",
 *     (event) => handler.handle(event)
 *   );
 *   return unsubscribe;
 * });
 * ```
 */
export interface IEventBusPort {
  /**
   * Publish a domain event to the event bus
   *
   * @param event - The domain event to publish
   * @returns Effect that completes when event is published, or fails with IPortError
   */
  publish<T extends IDomainEvent>(
    event: T,
  ): Effect.Effect<void, IPortError, never>;

  /**
   * Subscribe to events of a specific type
   *
   * @param eventTag - The event type discriminator (_tag value) to subscribe to
   * @param handler - Effect-based handler function for incoming events
   * @returns Effect containing unsubscribe function for cleanup
   */
  subscribe<T extends IDomainEvent, R = never>(
    eventTag: string,
    handler: (event: T) => Effect.Effect<void, never, R>,
  ): Effect.Effect<{ unsubscribe: () => void }, IPortError, never>;
}
