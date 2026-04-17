import { Context, Effect } from "effect";
import type { Group, IPortError, IGroupPort } from "@mirai-app/domain";

/**
 * Group Port - Context.Tag for Effect DI
 */
export class GroupPortTag extends Context.Tag("GroupPort")<
  GroupPortTag,
  IGroupPort
>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { IGroupPort };

/**
 * @deprecated Use GroupPortTag instead. Kept for backward compatibility.
 */
export const GroupPort = GroupPortTag;

/**
 * @deprecated Use IGroupPort instead. Kept for backward compatibility.
 */
export type GroupPort = typeof GroupPortTag;
