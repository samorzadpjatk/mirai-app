import { Context } from "effect";
import type {
  IAuthPort,
  IEventBusPort,
  IStoragePort,
  IEmailPort,
} from "@mirai-app/domain";

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

/**
 * Email Port Tag - Context Tag for Effect DI
 *
 * Use this tag to access the EmailPort implementation in Effect workflows:
 *   const emailPort = yield* EmailPortTag;
 *
 * The tag resolves to an IEmailPort implementation (SmtpEmailGateway
 * in production, mock implementations for testing) for sending emails.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const emailPort = yield* EmailPortTag;
 *   yield* emailPort.sendOtp({
 *     email: "user@example.com",
 *     otp: "123456",
 *     type: "email-verification"
 *   });
 * });
 * ```
 */
export class EmailPortTag extends Context.Tag("EmailPort")<
  EmailPortTag,
  IEmailPort
>() {}
