import { Context } from "effect";
import type { IActivityFeedPort, ActivityFeed } from "@mirai-app/domain";

/**
 * ActivityFeed Port - Context.Tag for Effect DI
 */
export class ActivityFeedPortTag extends Context.Tag("ActivityFeedPort")<
  ActivityFeedPortTag,
  IActivityFeedPort
>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { IActivityFeedPort, ActivityFeed };

/**
 * @deprecated Use ActivityFeedPortTag instead. Kept for backward compatibility.
 */
export const ActivityFeedPort = ActivityFeedPortTag;

/**
 * @deprecated Use IActivityFeedPort instead. Kept for backward compatibility.
 */
export type ActivityFeedPort = typeof ActivityFeedPortTag;
