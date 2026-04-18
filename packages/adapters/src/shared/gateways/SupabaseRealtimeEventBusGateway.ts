import { Effect } from "effect";
import type { SupabaseClient } from "../../infrastructure/supabase";
import type { IEventBusPort, IDomainEvent } from "@mirai-app/domain";
import { ApplicationError } from "@mirai-app/domain";

/**
 * Supabase Realtime Event Bus Gateway
 *
 * Implements IEventBusPort using Supabase Realtime broadcast/ON features.
 * Enables async event-driven communication across application instances.
 *
 * Design decisions:
 * - Channel naming: `domain-events-${eventTag.toLowerCase()}` for consistency
 * - Broadcast payload: Full event object serialized as JSON
 * - Handler execution: Effect.runFork for non-blocking handler invocation
 * - Error mapping: All Supabase errors mapped to ApplicationError
 *
 * @example
 * ```typescript
 * const gateway = new SupabaseRealtimeEventBusGateway(supabase);
 *
 * // Publish an event
 * await Effect.runPromise(gateway.publish(new NotificationCreated({ ... })));
 *
 * // Subscribe to events
 * const { unsubscribe } = await Effect.runPromise(
 *   gateway.subscribe("NotificationCreated", (event) =>
 *     Effect.gen(function* () {
 *       yield* handleNotification(event);
 *     })
 *   )
 * );
 *
 * // Cleanup
 * unsubscribe();
 * ```
 */
export class SupabaseRealtimeEventBusGateway implements IEventBusPort {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Publish a domain event to the event bus via Supabase Realtime broadcast
   *
   * @param event - The domain event to publish
   * @returns Effect that completes when broadcast is acknowledged
   */
  publish<T extends IDomainEvent>(event: T) {
    return Effect.tryPromise({
      try: async () => {
        const channel = `domain-events-${event._tag}`;
        const response = await this.supabase.channel(channel).send({
          type: "broadcast",
          event: event._tag,
          payload: event,
        });

        if (response === "error" || response === "timed out") {
          throw new Error(`Broadcast failed: ${response}`);
        }
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseRealtimeEventBusGateway.publish",
          cause: error,
        }),
    });
  }

  /**
   * Subscribe to events of a specific type
   *
   * @param eventTag - The event type discriminator (_tag value) to subscribe to
   * @param handler - Effect-based handler for incoming events (runs non-blocking)
   * @returns Effect containing unsubscribe function for cleanup
   */
  subscribe<T extends IDomainEvent, R = never>(
    eventTag: string,
    handler: (event: T) => Effect.Effect<void, never, R>,
  ) {
    return Effect.try({
      try: () => {
        const channel = `domain-events-${eventTag}`;
        const subscription = this.supabase
          .channel(channel)
          .on(
            "broadcast",
            { event: eventTag },
            (payload: { payload: unknown }) => {
              // Run handler asynchronously without blocking the subscription
              // Handlers must catch all errors internally (Effect<void, never, R>)
              // Dependencies (R) must be provided by the caller before subscription
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              Effect.runFork(handler(payload.payload as T) as any);
            },
          )
          .subscribe();

        return {
          unsubscribe: () => {
            subscription.unsubscribe();
          },
        };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseRealtimeEventBusGateway.subscribe",
          cause: error,
        }),
    });
  }
}
