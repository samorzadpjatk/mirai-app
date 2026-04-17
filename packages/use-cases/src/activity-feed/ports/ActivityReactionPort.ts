import { Context } from "effect";
import type { IActivityReactionPort, ActivityReactionType, ActivityReaction } from "@mirai-app/domain";

/**
 * ActivityReaction Port - Context.Tag for Effect DI
 */
export class ActivityReactionPortTag extends Context.Tag(
  "ActivityReactionPort",
)<ActivityReactionPortTag, IActivityReactionPort>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { IActivityReactionPort, ActivityReactionType, ActivityReaction };

/**
 * @deprecated Use ActivityReactionPortTag instead. Kept for backward compatibility.
 */
export const ActivityReactionPort = ActivityReactionPortTag;

/**
 * @deprecated Use IActivityReactionPort instead. Kept for backward compatibility.
 */
export type ActivityReactionPort = typeof ActivityReactionPortTag;
