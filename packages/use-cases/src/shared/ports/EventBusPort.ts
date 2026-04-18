import type { IEventBusPort } from "@mirai-app/domain";
import { Context } from "effect";

/**
 * EventBus Tag - Context Tag for Effect DI
 *
 * Use this tag to access the EventBus implementation in Effect workflows:
 *   const eventBus = yield* EventBusTag;
 *
 * The tag resolves to an IEventBusPort implementation (RedisEventBusGateway
 * in production, InProcessEventBusGateway for testing) for publishing and
 * subscribing to domain events.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const eventBus = yield* EventBusTag;
 *   yield* eventBus.publish(new NotificationCreated(...));
 * });
 * ```
 */
export class EventBusTag extends Context.Tag("EventBus")<
  EventBusTag,
  IEventBusPort
>() {}
