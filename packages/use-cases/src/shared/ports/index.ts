import { Context } from "effect";
import type { IAuthPort, IEventBusPort, IStoragePort } from "@mirai-app/domain";

/**
 * Auth Port Tag - Context Tag for Effect DI
 *
 * Use this tag to access the AuthPort implementation in Effect workflows:
 *   const auth = yield* AuthPortTag;
 */
export class AuthPortTag extends Context.Tag("AuthPort")<
  AuthPortTag,
  IAuthPort
>() {}

/**
 * Storage Port Tag - Context Tag for Effect DI
 *
 * Use this tag to access the StoragePort implementation in Effect workflows:
 *   const storage = yield* StoragePortTag;
 */
export class StoragePortTag extends Context.Tag("StoragePort")<
  StoragePortTag,
  IStoragePort
>() {}

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
