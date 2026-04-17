import { Context } from "effect";
import type { IAuthServicePort, AuthUserInfo, BanStatus } from "@mirai-app/domain";

/**
 * AuthService Port - Context.Tag for Effect DI
 */
export class AuthServicePortTag extends Context.Tag("AuthServicePort")<
  AuthServicePortTag,
  IAuthServicePort
>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { IAuthServicePort, AuthUserInfo, BanStatus };

/**
 * @deprecated Use AuthServicePortTag instead. Kept for backward compatibility.
 */
export const AuthServicePort = AuthServicePortTag;

/**
 * @deprecated Use IAuthServicePort instead. Kept for backward compatibility.
 */
export type AuthServicePort = typeof AuthServicePortTag;
