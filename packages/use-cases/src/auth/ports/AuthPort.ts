import { Context } from "effect";
import type { IAuthPort } from "@mirai-app/domain";

/**
 * Auth Port Tag - Context.Tag for Effect DI
 *
 * Use this tag to access the IAuthPort implementation in Effect workflows:
 *   const authPort = yield* AuthPortTag;
 *   yield* authPort.verifyAccess({ token, resourceType, resourceId, requiredPermission });
 */
export class AuthPortTag extends Context.Tag("AuthPort")<
  AuthPortTag,
  IAuthPort
>() {}

/**
 * Re-export types from domain for convenience
 */
export type { IAuthPort };
