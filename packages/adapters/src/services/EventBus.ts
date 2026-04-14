import type { AnyDomainEvent, DomainEvent } from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { serverLogger } from "@mirai-app/shared";

/**
 * EventBusError for EventBus operations
 */
export class EventBusError extends Data.TaggedError("EventBusError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "EVENT_BUS_ERROR" as const;
}

/**
 * EventHandler
 *
 * Type definition for event handlers.
 * Handlers receive the event and return an Effect.
 */
export type EventHandler<TEvent extends DomainEvent = AnyDomainEvent> = (
  event: TEvent,
) => Effect.Effect<void, EventBusError, never>;

/**
 * LegacyEventHandler
 *
 * Backward-compatible handler that can return void or Promise<void>.
 * Used for gradual migration.
 */
export type LegacyEventHandler<TEvent extends DomainEvent = AnyDomainEvent> = (
  event: TEvent,
) => void | Promise<void>;

/**
 * EventSubscription
 *
 * Handle returned from subscribe() that allows unsubscribing.
 */
export interface EventSubscription {
  unsubscribe(): Effect.Effect<void, never, never>;
}

/**
 * EventBus
 *
 * Typed in-process pub/sub for domain events using Effect.
 *
 * Phase 2: Real-Time Architecture
 * - Replaces external message brokers (RabbitMQ, Redis Pub/Sub) for in-process use
 * - Enables loose coupling between use cases and side effects
 * - NotificationDeliveryService subscribes to NotificationCreated
 * - ConnectionManager subscribes to LocationUpdated
 *
 * Design Decisions:
 * - Handlers return Effect for composable error handling
 * - Error isolation (one handler failure doesn't affect others)
 * - Type-safe event routing
 *
 * @example
 * ```typescript
 * // In use case: publish event
 * eventBus.publish(new NotificationCreated(
 *   crypto.randomUUID(),
 *   notification.id,
 *   recipient.id,
 *   notification.title,
 *   notification.body,
 *   notification.priority,
 *   new Date()
 * ));
 *
 * // In service: subscribe to events
 * eventBus.subscribe("NotificationCreated", (event) =>
 *   Effect.tryPromise({
 *     try: () => pushNotificationService.send(event),
 *     catch: (error) => new EventBusError({ operation: "send", message: String(error) })
 *   })
 * );
 * ```
 */
export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Subscribe to events of a specific type
   *
   * @param eventType - The type of event to subscribe to
   * @param handler - The handler function that returns an Effect
   * @returns Subscription handle for unsubscribing
   *
   * @example
   * ```typescript
   * const sub = eventBus.subscribe("NotificationCreated", (event) =>
   *   Effect.sync(() => console.log("Notification created:", event.notificationId))
   * );
   *
   * // Later: unsubscribe
   * Effect.runSync(sub.unsubscribe());
   * ```
   */
  subscribe<TEvent extends AnyDomainEvent>(
    eventType: TEvent["type"],
    handler: EventHandler<TEvent>,
  ): EventSubscription {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    const handlersForType = this.handlers.get(eventType)!;
    handlersForType.add(handler as EventHandler);

    return {
      unsubscribe: () =>
        Effect.sync(() => {
          handlersForType.delete(handler as EventHandler);
          // Clean up empty handler sets
          if (handlersForType.size === 0) {
            this.handlers.delete(eventType);
          }
        }),
    };
  }

  /**
   * Subscribe with a legacy handler (void or Promise<void>)
   *
   * Use this for gradual migration from non-Effect code.
   *
   * @param eventType - The type of event to subscribe to
   * @param handler - Legacy handler function
   * @returns Subscription handle for unsubscribing
   */
  subscribeLegacy<TEvent extends AnyDomainEvent>(
    eventType: TEvent["type"],
    handler: LegacyEventHandler<TEvent>,
  ): EventSubscription {
    // Wrap legacy handler in Effect
    const effectHandler: EventHandler<TEvent> = (event) => {
      return Effect.tryPromise({
        try: async () => {
          const result = handler(event);
          if (result instanceof Promise) {
            await result;
          }
        },
        catch: (error) =>
          new EventBusError({
            operation: "legacyHandler",
            message: `Legacy handler failed for event ${eventType}: ${error instanceof Error ? error.message : String(error)}`,
            cause: error,
          }),
      });
    };

    return this.subscribe(eventType, effectHandler);
  }

  /**
   * Subscribe to all events (for logging, metrics, etc.)
   *
   * @param handler - Handler that receives all events
   * @returns Subscription handle
   */
  subscribeAll(handler: EventHandler<AnyDomainEvent>): EventSubscription {
    // Store as a special wildcard handler
    const wildcardType = "*";
    if (!this.handlers.has(wildcardType)) {
      this.handlers.set(wildcardType, new Set());
    }

    const wildcardHandlers = this.handlers.get(wildcardType)!;
    wildcardHandlers.add(handler);

    return {
      unsubscribe: () =>
        Effect.sync(() => {
          wildcardHandlers.delete(handler);
          if (wildcardHandlers.size === 0) {
            this.handlers.delete(wildcardType);
          }
        }),
    };
  }

  /**
   * Publish an event to all subscribers
   *
   * Returns an Effect that executes all handlers. Errors in individual
   * handlers are caught and logged, not thrown to the caller.
   *
   * @param event - The domain event to publish
   * @returns Effect that completes when all handlers have been triggered
   *
   * @example
   * ```typescript
   * const publishEffect = eventBus.publish(new NotificationCreated(
   *   crypto.randomUUID(),
   *   notificationId,
   *   recipientId,
   *   title,
   *   body,
   *   priority,
   *   new Date()
   * ));
   *
   * // Execute the effect
   * await Effect.runPromise(publishEffect);
   * ```
   */
  publish<TEvent extends AnyDomainEvent>(
    event: TEvent,
  ): Effect.Effect<void, never, never> {
    return Effect.gen(this, function* () {
      const effects: Effect.Effect<void, EventBusError, never>[] = [];

      // Collect typed handlers
      const handlersForType = this.handlers.get(event.type);
      if (handlersForType) {
        for (const handler of handlersForType) {
          effects.push(
            handler(event).pipe(
              Effect.catchAll((error) =>
                Effect.sync(() => {
                  serverLogger.error(
                    `EventBus: Handler error for event ${event.type}:`,
                    { error },
                  );
                }),
              ),
            ),
          );
        }
      }

      // Collect wildcard handlers
      const wildcardHandlers = this.handlers.get("*");
      if (wildcardHandlers) {
        for (const handler of wildcardHandlers) {
          effects.push(
            handler(event).pipe(
              Effect.catchAll((error) =>
                Effect.sync(() => {
                  serverLogger.error(
                    `EventBus: Wildcard handler error for event ${event.type}:`,
                    { error },
                  );
                }),
              ),
            ),
          );
        }
      }

      // Execute all handlers in parallel, catching individual errors
      if (effects.length > 0) {
        yield* Effect.all(effects, { discard: true });
      }
    });
  }

  /**
   * Publish and forget (fire-and-forget style)
   *
   * For cases where you don't need to wait for handlers to complete.
   * Errors are logged but not returned.
   *
   * @param event - The domain event to publish
   */
  publishFireAndForget<TEvent extends AnyDomainEvent>(event: TEvent): void {
    Effect.runFork(this.publish(event));
  }

  /**
   * Get the number of handlers for an event type (for testing/monitoring)
   */
  getHandlerCount(eventType: string): number {
    const handlers = this.handlers.get(eventType);
    return handlers?.size ?? 0;
  }

  /**
   * Clear all handlers (for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

/**
 * Singleton EventBus instance
 *
 * Use this for application-wide event distribution.
 * For testing, create a new EventBus instance.
 */
export const globalEventBus = new EventBus();
