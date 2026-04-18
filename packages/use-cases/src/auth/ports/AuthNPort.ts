import { Context } from "effect";
import type { IAuthNPort } from "@mirai-app/domain";

/**
 * AuthN Port Tag - Context.Tag for Effect DI
 *
 * Use this tag to access the IAuthNPort implementation in Effect workflows:
 *   const authNPort = yield* AuthNPortTag;
 *   const session = yield* authNPort.getSession();
 *
 * AuthN (Authentication) handles identity verification:
 * - signIn/signOut
 * - Session management
 * - Token validation
 */
export class AuthNPortTag extends Context.Tag("AuthN")<
  AuthNPortTag,
  IAuthNPort
>() {}

/**
 * Re-export types from domain for convenience
 */
export type { IAuthNPort };
