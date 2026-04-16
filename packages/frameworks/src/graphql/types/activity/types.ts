import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import type {
  ActivityFeedDTO,
  ActivityReactionDTO,
} from "@mirai-app/use-cases";

/**
 * Activity Type Enum
 */
const ActivityTypeEnum = builder.enumType("ActivityType", {
  description: "The type of activity feed item",
  values: {
    GENERAL: { value: "GENERAL" },
    CHALLENGE: { value: "CHALLENGE" },
    ANNOUNCEMENT: { value: "ANNOUNCEMENT" },
    RANK_CHANGE: { value: "RANK_CHANGE" },
    SUBMISSION: { value: "SUBMISSION" },
    CUSTOM: { value: "CUSTOM" },
  },
});

/**
 * Reaction Type Enum
 */
const ReactionTypeEnum = builder.enumType("ReactionType", {
  description: "The type of reaction on an activity",
  values: {
    HEART: { value: "HEART" },
    FIRE: { value: "FIRE" },
    CLAP: { value: "CLAP" },
    STAR: { value: "STAR" },
  },
});

/**
 * Activity Type
 *
 * GraphQL type definition for activity feed items.
 */
const ActivityType = builder.objectType("Activity", {
  description: "An activity feed item in a trip",
  fields: (t) => ({
    id: t.exposeID("id"),
    tripId: t.exposeID("tripId"),
    userId: t.exposeID("userId"),
    activityType: t.field({
      type: ActivityTypeEnum,
      resolve: (activity: ActivityFeedDTO) =>
        activity.activityType as
          | "GENERAL"
          | "CHALLENGE"
          | "ANNOUNCEMENT"
          | "RANK_CHANGE"
          | "SUBMISSION"
          | "CUSTOM",
    }),
    content: t.exposeString("content"),
    createdAt: t.field({
      type: "DateTime",
      resolve: (activity: ActivityFeedDTO) => activity.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (activity: ActivityFeedDTO) => activity.updatedAt,
    }),
    isPinned: t.exposeBoolean("isPinned"),
    isHidden: t.exposeBoolean("isHidden"),
    hiddenByAdmin: t.exposeID("hiddenByAdmin", { nullable: true }),
    hiddenAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (activity: ActivityFeedDTO) => activity.hiddenAt,
    }),
    hiddenReason: t.exposeString("hiddenReason", { nullable: true }),
    metadata: t.field({
      type: "JSONObject",
      nullable: true,
      resolve: (activity: ActivityFeedDTO) => activity.metadata,
    }),
  }),
});

/**
 * Activity Reaction Type
 *
 * GraphQL type definition for activity reactions.
 */
const ActivityReactionType = builder.objectType("ActivityReaction", {
  description: "A reaction on an activity feed item",
  fields: (t) => ({
    id: t.exposeID("id"),
    activityId: t.exposeID("activityId"),
    userId: t.exposeID("userId"),
    reactionType: t.field({
      type: ReactionTypeEnum,
      resolve: (reaction: ActivityReactionDTO) =>
        reaction.reactionType as "HEART" | "FIRE" | "CLAP" | "STAR",
    }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (reaction: ActivityReactionDTO) => reaction.createdAt,
    }),
  }),
});

/**
 * Hidden Activity Result Type
 *
 * Result type for hide/unhide activity operations.
 */
const HiddenActivityResultType = builder.objectType("HiddenActivityResult", {
  description: "Result of hiding or unhiding an activity",
  fields: (t) => ({
    activity: t.field({
      type: ActivityType,
      resolve: (parent: { activity: ActivityFeedDTO }) => parent.activity,
    }),
    success: t.exposeBoolean("success"),
    message: t.exposeString("message", { nullable: true }),
  }),
});

/**
 * Activity Edge Type
 */
const ActivityEdgeType = builder.objectType("ActivityEdge", {
  description: "An edge in an activity connection",
  fields: (t) => ({
    node: t.field({
      type: ActivityType,
      resolve: (parent: { node: ActivityFeedDTO; cursor: string }) =>
        parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * Activity Connection Type
 *
 * Relay-compliant connection type for paginated activities.
 */
const ActivityConnectionType = builder.objectType("ActivityConnection", {
  description: "A connection of activities for Relay pagination",
  fields: (t) => ({
    edges: t.field({
      type: [ActivityEdgeType],
      resolve: (parent: {
        edges: Array<{ node: ActivityFeedDTO; cursor: string }>;
      }) => parent.edges,
    }),
    nodes: t.field({
      type: [ActivityType],
      resolve: (parent: { nodes: ActivityFeedDTO[] }) => parent.nodes,
    }),
    pageInfo: t.field({
      type: "PageInfo",
      resolve: (parent: {
        pageInfo: {
          hasNextPage: boolean;
          hasPreviousPage: boolean;
          startCursor: string | null;
          endCursor: string | null;
        };
      }) => parent.pageInfo,
    }),
    totalCount: t.field({
      type: "Int",
      nullable: true,
      resolve: () => undefined,
    }),
  }),
});

/**
 * Helper to encode activity cursor
 * Uses createdAt and isPinned as sort fields
 */
function encodeActivityCursor(activity: ActivityFeedDTO): string {
  return encodeCursor({
    id: activity.id,
    createdAt: activity.createdAt.toISOString(),
    isPinned: activity.isPinned,
  });
}

/**
 * Helper to build activity connection response
 */
function buildActivityConnection(
  items: ActivityFeedDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: ActivityFeedDTO; cursor: string }>;
  nodes: ActivityFeedDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeActivityCursor(item),
  }));

  return {
    edges,
    nodes: items,
    pageInfo: {
      hasNextPage: hasMore,
      hasPreviousPage,
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
    },
  };
}

export {
  ActivityType,
  ActivityEdgeType,
  ActivityConnectionType,
  ActivityReactionType,
  HiddenActivityResultType,
  ActivityTypeEnum,
  ReactionTypeEnum,
  encodeActivityCursor,
  buildActivityConnection,
};
