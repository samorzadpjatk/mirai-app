import type { Effect } from "effect";
import type { IDomainEvent } from "./DomainEvent";

/**
 * IEventHandler<T> - Standardized handler interface for domain events
 *
 * Event handlers implement this interface to process specific event types.
 * Handlers must catch all errors internally (Effect<void, never, R>)
 * to prevent event bus disruption while allowing dependency injection.
 *
 * Design decisions:
 * - Effect<void, never, R> return type - no errors leak to event bus, dependencies allowed
 * - eventTag field for type identification at runtime
 * - Generic T parameter for type-safe event handling
 * - Generic R parameter for dependency injection via Effect Context
 *
 * Error isolation requirement:
 * Handlers MUST catch all errors internally using Effect.catchAll or similar.
 * This prevents a single handler failure from affecting other handlers or
 * crashing the event bus.
 *
 * @example
 * ```typescript
 * class NotificationSendHandler implements IEventHandler<NotificationCreated, MyPortTag> {
 *   readonly eventTag = "NotificationCreated";
 *
 *   handle(event: NotificationCreated): Effect.Effect<void, never, MyPortTag> {
 *     return Effect.gen(function* () {
 *       // ... handle event ...
 *     }).pipe(
 *       Effect.catchAll((error) => {
 *         // Log error but don't propagate
 *         return Effect.void;
 *       })
 *     );
 *   }
 * }
 * ```
 */
export interface IEventHandler<
  T extends IDomainEvent,
  R = never,
> {
  /** Event type discriminator this handler processes */
  readonly eventTag: string;

  /**
   * Handle the domain event
   *
   * @param event - The domain event to process
   * @returns Effect that completes when handling is done (never fails, may require dependencies)
   */
  handle(event: T): Effect.Effect<void, never, R>;
}
