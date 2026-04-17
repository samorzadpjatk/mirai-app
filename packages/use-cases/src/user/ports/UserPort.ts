import { Context } from "effect";
import type { IUserPort, User } from "@mirai-app/domain";

/**
 * User Port - Context.Tag for Effect DI
 */
export class UserPortTag extends Context.Tag("UserPort")<
  UserPortTag,
  IUserPort
>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { IUserPort, User };

/**
 * @deprecated Use UserPortTag instead. Kept for backward compatibility.
 */
export const UserPort = UserPortTag;

/**
 * @deprecated Use IUserPort instead. Kept for backward compatibility.
 */
export type UserPort = typeof UserPortTag;
