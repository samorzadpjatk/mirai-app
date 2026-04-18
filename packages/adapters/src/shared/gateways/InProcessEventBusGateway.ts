import { Effect } from "effect";
import type { IEventBusPort, IDomainEvent, IPortError } from "@mirai-app/domain";
import { ApplicationError } from "@mirai-app/domain";

/**
 * InProcessEventBusGateway - Testing-only synchronous event bus implementation
 *
 * Purpose:
 * - Provides a fast, deterministic, in-memory event bus for unit and integration tests
 * - No external dependencies (no Supabase, no network calls)
 * - Fresh instance per test for complete isolation
 *
 * Implementation:
 * - Uses Map<string, Array<handler>> for in-memory handler storage
 * - Synchronous handler invocation for deterministic test behavior
 * - Returns Effect<void, IPortError, never> to match IEventBusPort contract
 *
 * Usage:
 * ```typescript
 * const testLayer = Layer.succeed(
 *   EventBusTag,
 *   new InProcessEventBusGateway()
 * );
 *
 * const result = await Effect.runPromise(
 *   program.pipe(Effect.provide(testLayer))
 * );
 * ```
 *
 * Characteristics:
 * - Synchronous: Handlers invoked immediately during publish()
 * - Isolated: Each instance has its own handler Map
 * - Type-safe: Generic handler registration and event publishing
 * - Never fails: Since it's in-memory and sync, errors are extremely unlikely
 */
export class InProcessEventBusGateway implements IEventBusPort {
  /**
   * In-memory handler storage
   * Key: event tag string (e.g., "NotificationCreated")
   * Value: array of handler functions for that event type
   */
  private handlers = new Map<
    string,
    Array<(event: unknown) => Effect.Effect<void, never, unknown>>
  >();

  /**
   * Publish a domain event to all registered handlers
   *
   * Looks up handlers by event._tag and invokes them synchronously.
   * All handlers run to completion before returning.
   *
   * Note: This implementation never fails (returns Effect<void, never, never>
   * wrapped to satisfy IEventBusPort), making tests predictable.
   *
   * @param event - The domain event to publish
   * @returns Effect that completes when all handlers have been invoked
   */
  publish<T extends IDomainEvent>(event: T): Effect.Effect<void, IPortError, never> {
    const handlers = this.handlers.get(event._tag);

    if (handlers && handlers.length > 0) {
      const effects = handlers.map((handler) => handler(event));
      // Execute all handlers - errors are caught internally by handlers
      // Type assertion: handlers have R=never because dependencies are provided externally
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Effect.all(effects, { discard: true }) as any;
    }

    return Effect.void;
  }

  /**
   * Subscribe to events of a specific type
   *
   * Registers a handler function for the given event tag.
   * Returns an unsubscribe function for cleanup.
   *
   * Note: This implementation never fails (returns Effect.succeed),
   * making tests predictable.
   *
   * @param eventTag - The event type discriminator (_tag value) to subscribe to
   * @param handler - Effect-based handler function for incoming events
   * @returns Effect containing unsubscribe function for cleanup
   */
  subscribe<T extends IDomainEvent, R = never>(
    eventTag: string,
    handler: (event: T) => Effect.Effect<void, never, R>,
  ) {
    const existingHandlers = this.handlers.get(eventTag) ?? [];
    existingHandlers.push(handler as (event: unknown) => Effect.Effect<void, never, unknown>);
    this.handlers.set(eventTag, existingHandlers);

    const unsubscribe = () => {
      const handlers = this.handlers.get(eventTag);
      if (handlers) {
        const index = handlers.indexOf(handler as (event: unknown) => Effect.Effect<void, never, unknown>);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };

    return Effect.succeed({ unsubscribe });
  }

  /**
   * Clear all handlers - useful for test cleanup
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Get count of registered handlers for a specific event tag
   * Useful for test assertions
   */
  handlerCount(eventTag: string): number {
    return this.handlers.get(eventTag)?.length ?? 0;
  }
}
