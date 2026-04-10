import type { AnyDomainEvent, DomainEvent } from "@mirai-app/domain";

/**
 * EventHandler
 *
 * Type definition for event handlers.
 * Handlers receive the event and can perform side effects.
 */
export type EventHandler<TEvent extends DomainEvent = AnyDomainEvent> = (
  event: TEvent,
) => void | Promise<void>;

/**
 * EventSubscription
 *
 * Handle returned from subscribe() that allows unsubscribing.
 */
export interface EventSubscription {
  unsubscribe(): void;
}

/**
 * EventBus
 *
 * Typed in-process pub/sub for domain events.
 *
 * Phase 2: Real-Time Architecture
 * - Replaces external message brokers (RabbitMQ, Redis Pub/Sub) for in-process use
 * - Enables loose coupling between use cases and side effects
 * - NotificationDeliveryService subscribes to NotificationCreated
 * - ConnectionManager subscribes to LocationUpdated
 *
 * Design Decisions:
 * - Synchronous publish (handlers execute immediately)
 * - Async handlers don't block the publisher
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
 * eventBus.subscribe("NotificationCreated", async (event) => {
 *   await pushNotificationService.send(event);
 * });
 * ```
 */
export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Subscribe to events of a specific type
   *
   * @param eventType - The type of event to subscribe to
   * @param handler - The handler function to call when events occur
   * @returns Subscription handle for unsubscribing
   *
   * @example
   * ```typescript
   * const sub = eventBus.subscribe("NotificationCreated", async (event) => {
   *   console.log("Notification created:", event.notificationId);
   *   await sendPushNotification(event);
   * });
   *
   * // Later: unsubscribe
   * sub.unsubscribe();
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
      unsubscribe: () => {
        handlersForType.delete(handler as EventHandler);
        // Clean up empty handler sets
        if (handlersForType.size === 0) {
          this.handlers.delete(eventType);
        }
      },
    };
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
      unsubscribe: () => {
        wildcardHandlers.delete(handler);
        if (wildcardHandlers.size === 0) {
          this.handlers.delete(wildcardType);
        }
      },
    };
  }

  /**
   * Publish an event to all subscribers
   *
   * Handlers execute synchronously but async handlers don't block.
   * Errors in handlers are caught and logged, not thrown to the publisher.
   *
   * @param event - The domain event to publish
   *
   * @example
   * ```typescript
   * eventBus.publish(new NotificationCreated(
   *   crypto.randomUUID(),
   *   notificationId,
   *   recipientId,
   *   title,
   *   body,
   *   priority,
   *   new Date()
   * ));
   * ```
   */
  publish<TEvent extends AnyDomainEvent>(event: TEvent): void {
    // Execute typed handlers
    const handlersForType = this.handlers.get(event.type);
    if (handlersForType) {
      for (const handler of handlersForType) {
        this.executeHandler(handler, event);
      }
    }

    // Execute wildcard handlers
    const wildcardHandlers = this.handlers.get("*");
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        this.executeHandler(handler, event);
      }
    }
  }

  /**
   * Execute a handler with error isolation
   */
  private executeHandler<TEvent extends AnyDomainEvent>(
    handler: EventHandler<TEvent>,
    event: TEvent,
  ): void {
    try {
      const result = handler(event);

      // Handle async handlers
      if (result instanceof Promise) {
        result.catch((error) => {
          console.error(
            `EventBus: Async handler error for event ${event.type}:`,
            error,
          );
        });
      }
    } catch (error) {
      // Log error but don't break other handlers
      console.error(
        `EventBus: Sync handler error for event ${event.type}:`,
        error,
      );
    }
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
