import { Context } from "effect";
import type { IEmailPort } from "@mirai-app/domain";

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
