import { Context } from "effect";
import type { IGroupJoinRequestPort, GroupJoinRequest } from "@mirai-app/domain";

/**
 * GroupJoinRequest Port - Context.Tag for Effect DI
 */
export class GroupJoinRequestPortTag extends Context.Tag(
  "GroupJoinRequestPort",
)<GroupJoinRequestPortTag, IGroupJoinRequestPort>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { IGroupJoinRequestPort, GroupJoinRequest };

/**
 * @deprecated Use GroupJoinRequestPortTag instead. Kept for backward compatibility.
 */
export const GroupJoinRequestPort = GroupJoinRequestPortTag;

/**
 * @deprecated Use IGroupJoinRequestPort instead. Kept for backward compatibility.
 */
export type GroupJoinRequestPort = typeof GroupJoinRequestPortTag;
