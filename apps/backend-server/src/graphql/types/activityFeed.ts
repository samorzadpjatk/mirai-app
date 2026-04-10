/**
 * Activity Feed GraphQL Types
 *
 * Pothos type definitions for the Activity Feed domain.
 * Maps from ActivityFeed DTOs to GraphQL schema types.
 *
 * @module activityFeed/types
 */

import { builder } from "../builder";
import type {
  ActivityOutput,
  GetActivityFeedOutput,
  AddReactionOutput,
} from "@mirai-app/use-cases";
import type { ReactionType } from "@mirai-app/domain";

// =============================================================================
// Enums
// =============================================================================

/**
 * Reaction type enum for GraphQL
 */
export const ReactionTypeEnum = builder.enumType("ReactionType", {
  description: "Types of reactions users can add to activities",
  values: {
    HEART: { value: "heart" as ReactionType },
    FIRE: { value: "fire" as ReactionType },
    CLAP: { value: "clap" as ReactionType },
    STAR: { value: "star" as ReactionType },
  },
});

/**
 * Activity type enum
 */
export const ActivityTypeEnum = builder.enumType("ActivityType", {
  description: "Types of activities in the feed",
  values: {
    CUSTOM: { value: "custom" },
    USER_POST: { value: "user_post" },
    SUBMISSION: { value: "submission" },
    CHALLENGE_EVENT: { value: "challenge_event" },
    RANK_CHANGE: { value: "rank_change" },
  },
});

/**
 * Challenge event type enum
 */
export const ChallengeEventTypeEnum = builder.enumType("ChallengeEventType", {
  description: "Types of challenge events",
  values: {
    CHALLENGE_STARTED: { value: "challenge_started" },
    VOTING_STARTED: { value: "voting_started" },
    COMPLETED: { value: "completed" },
  },
});

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input type for activity cursor pagination
 */
export const ActivityCursorInput = builder.inputType("ActivityCursorInput", {
  description: "Cursor for paginating through activity feed",
  fields: (t) => ({
    id: t.id({
      description: "Activity ID for the cursor",
      required: true,
    }),
    createdAt: t.field({
      type: "DateTime",
      description: "Created timestamp for the cursor",
      required: true,
    }),
    isPinned: t.boolean({
      description: "Whether the cursor activity is pinned",
      required: true,
    }),
  }),
});

/**
 * Input type for getByTrip query
 */
export const GetByTripInput = builder.inputType("GetByTripInput", {
  description: "Input for fetching activities by trip ID",
  fields: (t) => ({
    tripId: t.id({
      description: "Trip ID to fetch activities for",
      required: true,
    }),
    pageSize: t.int({
      description: "Number of activities to return (1-100)",
      required: false,
      defaultValue: 30,
    }),
    cursor: t.field({
      type: ActivityCursorInput,
      description: "Cursor for pagination",
      required: false,
    }),
  }),
});

/**
 * Input type for getByTripModeration query
 */
export const GetByTripModerationInput = builder.inputType(
  "GetByTripModerationInput",
  {
    description: "Input for fetching activities for moderation",
    fields: (t) => ({
      tripId: t.id({
        description: "Trip ID to fetch activities for",
        required: true,
      }),
      page: t.int({
        description: "Page number (1-based)",
        required: false,
        defaultValue: 1,
      }),
      pageSize: t.int({
        description: "Number of activities to return (1-100)",
        required: false,
        defaultValue: 20,
      }),
    }),
  },
);

/**
 * Input type for getById query
 */
export const GetByIdInput = builder.inputType("GetByIdInput", {
  description: "Input for fetching a single activity by ID",
  fields: (t) => ({
    id: t.id({
      description: "Activity ID to fetch",
      required: true,
    }),
  }),
});

/**
 * Input type for createCustom mutation
 */
export const CreateCustomActivityInput = builder.inputType(
  "CreateCustomActivityInput",
  {
    description: "Input for creating a custom activity",
    fields: (t) => ({
      tripId: t.id({
        description: "Trip ID to create activity for",
        required: true,
      }),
      title: t.string({
        description: "Activity title",
        required: true,
      }),
      description: t.string({
        description: "Activity description",
        required: false,
      }),
      imageUrl: t.string({
        description: "Activity image URL",
        required: false,
      }),
      isPinned: t.boolean({
        description: "Whether to pin the activity",
        required: false,
        defaultValue: false,
      }),
    }),
  },
);

/**
 * Input type for createUserPost mutation
 */
export const CreateUserPostInput = builder.inputType("CreateUserPostInput", {
  description: "Input for creating a user post activity",
  fields: (t) => ({
    tripId: t.id({
      description: "Trip ID to create post for",
      required: true,
    }),
    title: t.string({
      description: "Post title",
      required: true,
    }),
    description: t.string({
      description: "Post description",
      required: false,
    }),
    imageUrl: t.string({
      description: "Post image URL",
      required: false,
    }),
    additionalImages: t.stringList({
      description: "Additional image URLs (max 10)",
      required: false,
    }),
  }),
});

/**
 * Input type for createSubmissionActivity mutation
 */
export const CreateSubmissionActivityInput = builder.inputType(
  "CreateSubmissionActivityInput",
  {
    description: "Input for creating a submission activity",
    fields: (t) => ({
      tripId: t.id({
        description: "Trip ID",
        required: true,
      }),
      submissionId: t.id({
        description: "Submission ID",
        required: true,
      }),
      challengeId: t.id({
        description: "Challenge ID",
        required: true,
      }),
      groupId: t.id({
        description: "Group ID",
        required: true,
      }),
      title: t.string({
        description: "Activity title",
        required: true,
      }),
      description: t.string({
        description: "Activity description",
        required: false,
      }),
      imageUrl: t.string({
        description: "Activity image URL",
        required: false,
      }),
      hasVideo: t.boolean({
        description: "Whether submission has video",
        required: false,
      }),
      isWinner: t.boolean({
        description: "Whether submission is a winner",
        required: false,
      }),
      ranking: t.int({
        description: "Submission ranking",
        required: false,
      }),
      pointsAwarded: t.int({
        description: "Points awarded",
        required: false,
      }),
      isPinned: t.boolean({
        description: "Whether to pin the activity",
        required: false,
        defaultValue: false,
      }),
    }),
  },
);

/**
 * Input type for createChallengeActivity mutation
 */
export const CreateChallengeActivityInput = builder.inputType(
  "CreateChallengeActivityInput",
  {
    description: "Input for creating a challenge event activity",
    fields: (t) => ({
      tripId: t.id({
        description: "Trip ID",
        required: true,
      }),
      challengeId: t.id({
        description: "Challenge ID",
        required: true,
      }),
      eventType: t.field({
        type: ChallengeEventTypeEnum,
        description: "Type of challenge event",
        required: true,
      }),
      title: t.string({
        description: "Activity title",
        required: true,
      }),
      description: t.string({
        description: "Activity description",
        required: false,
      }),
      endTime: t.field({
        type: "DateTime",
        description: "Challenge end time",
        required: false,
      }),
      submissionType: t.string({
        description: "Submission type",
        required: false,
      }),
      basePoints: t.int({
        description: "Base points for challenge",
        required: false,
      }),
      submissionCount: t.int({
        description: "Number of submissions",
        required: false,
      }),
      isPinned: t.boolean({
        description: "Whether to pin the activity",
        required: false,
        defaultValue: false,
      }),
    }),
  },
);

/**
 * Input type for createRankChangeActivity mutation
 */
export const CreateRankChangeActivityInput = builder.inputType(
  "CreateRankChangeActivityInput",
  {
    description: "Input for creating a rank change activity",
    fields: (t) => ({
      tripId: t.id({
        description: "Trip ID",
        required: true,
      }),
      groupId: t.id({
        description: "Group ID",
        required: true,
      }),
      newRank: t.int({
        description: "New rank position",
        required: true,
      }),
      totalCoins: t.int({
        description: "Total coins",
        required: true,
      }),
      coinsGained: t.int({
        description: "Coins gained",
        required: true,
      }),
      title: t.string({
        description: "Activity title",
        required: true,
      }),
      description: t.string({
        description: "Activity description",
        required: false,
      }),
      isPinned: t.boolean({
        description: "Whether to pin the activity",
        required: false,
        defaultValue: false,
      }),
    }),
  },
);

/**
 * Input type for update mutation
 */
export const UpdateActivityInput = builder.inputType("UpdateActivityInput", {
  description: "Input for updating an activity",
  fields: (t) => ({
    activityId: t.id({
      description: "Activity ID to update",
      required: true,
    }),
    title: t.string({
      description: "New title",
      required: false,
    }),
    description: t.string({
      description: "New description (null to clear)",
      required: false,
    }),
    isPinned: t.boolean({
      description: "Pin/unpin the activity",
      required: false,
    }),
  }),
});

/**
 * Input type for setPinned mutation
 */
export const SetPinnedInput = builder.inputType("SetPinnedInput", {
  description: "Input for pinning/unpinning an activity",
  fields: (t) => ({
    activityId: t.id({
      description: "Activity ID",
      required: true,
    }),
    isPinned: t.boolean({
      description: "Whether to pin or unpin",
      required: true,
    }),
  }),
});

/**
 * Input type for hide mutation
 */
export const HideActivityInput = builder.inputType("HideActivityInput", {
  description: "Input for hiding an activity",
  fields: (t) => ({
    activityId: t.id({
      description: "Activity ID to hide",
      required: true,
    }),
    reason: t.string({
      description: "Reason for hiding",
      required: false,
    }),
  }),
});

/**
 * Input type for unhide mutation
 */
export const UnhideActivityInput = builder.inputType("UnhideActivityInput", {
  description: "Input for unhiding an activity",
  fields: (t) => ({
    activityId: t.id({
      description: "Activity ID to unhide",
      required: true,
    }),
  }),
});

/**
 * Input type for toggleReaction mutation
 */
export const ToggleReactionInput = builder.inputType("ToggleReactionInput", {
  description: "Input for toggling a reaction on an activity",
  fields: (t) => ({
    activityId: t.id({
      description: "Activity ID",
      required: true,
    }),
    reactionType: t.field({
      type: ReactionTypeEnum,
      description: "Type of reaction",
      required: true,
    }),
  }),
});

/**
 * Input type for delete mutation
 */
export const DeleteActivityInput = builder.inputType("DeleteActivityInput", {
  description: "Input for deleting an activity",
  fields: (t) => ({
    activityId: t.id({
      description: "Activity ID to delete",
      required: true,
    }),
  }),
});

// =============================================================================
// Object Types
// =============================================================================

/**
 * Admin info for activity
 */
export const ActivityAdminType = builder.objectType("ActivityAdmin", {
  description: "Admin user who created the activity",
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "Admin user ID",
      nullable: false,
    }),
    firstName: t.exposeString("firstName", {
      description: "Admin first name",
      nullable: false,
    }),
    lastName: t.exposeString("lastName", {
      description: "Admin last name",
      nullable: false,
    }),
  }),
});

/**
 * Activity output type
 */
export const ActivityType = builder.objectType("Activity", {
  description: "An activity in the feed",
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "Unique activity ID",
      nullable: false,
    }),
    tripId: t.exposeID("tripId", {
      description: "Trip ID this activity belongs to",
      nullable: false,
    }),
    activityType: t.field({
      type: ActivityTypeEnum,
      description: "Type of activity",
      nullable: false,
      resolve: (activity: ActivityOutput) =>
        activity.activityType.toUpperCase().replace(/_/g, "_") as
          | "CUSTOM"
          | "USER_POST"
          | "SUBMISSION"
          | "CHALLENGE_EVENT"
          | "RANK_CHANGE",
    }),
    title: t.exposeString("title", {
      description: "Activity title",
      nullable: false,
    }),
    description: t.exposeString("description", {
      description: "Activity description",
      nullable: true,
    }),
    imageUrl: t.exposeString("imageUrl", {
      description: "Activity image URL",
      nullable: true,
    }),
    isPinned: t.exposeBoolean("isPinned", {
      description: "Whether activity is pinned",
      nullable: false,
    }),
    isHidden: t.exposeBoolean("isHidden", {
      description: "Whether activity is hidden",
      nullable: false,
    }),
    createdAt: t.field({
      type: "DateTime",
      description: "When activity was created",
      nullable: false,
      resolve: (activity: ActivityOutput) => activity.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      description: "When activity was last updated",
      nullable: false,
      resolve: (activity: ActivityOutput) => activity.updatedAt,
    }),
    admin: t.field({
      type: ActivityAdminType,
      description: "Admin who created this activity (null if user post)",
      nullable: true,
      resolve: (activity: ActivityOutput) => activity.admin,
    }),
  }),
});

/**
 * Pagination info type
 */
export const PaginationInfoType = builder.objectType("PaginationInfo", {
  description: "Pagination information for activity feed",
  fields: (t) => ({
    pageSize: t.exposeInt("pageSize", {
      description: "Number of items per page",
      nullable: false,
    }),
    hasMore: t.exposeBoolean("hasMore", {
      description: "Whether there are more items",
      nullable: false,
    }),
  }),
});

/**
 * Cursor type for pagination
 */
export const ActivityCursorType = builder.objectType("ActivityCursor", {
  description: "Cursor for paginating through activities",
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "Activity ID",
      nullable: false,
    }),
    createdAt: t.field({
      type: "DateTime",
      description: "Created timestamp",
      nullable: false,
      resolve: (cursor: { id: string; createdAt: Date; isPinned: boolean }) =>
        cursor.createdAt,
    }),
    isPinned: t.exposeBoolean("isPinned", {
      description: "Whether cursor activity is pinned",
      nullable: false,
    }),
  }),
});

/**
 * Activity feed result type
 */
export const ActivityFeedResultType = builder.objectType("ActivityFeedResult", {
  description: "Result of fetching activity feed",
  fields: (t) => ({
    activities: t.field({
      type: [ActivityType],
      description: "List of activities",
      nullable: false,
      resolve: (result: GetActivityFeedOutput) => result.activities,
    }),
    nextCursor: t.field({
      type: ActivityCursorType,
      description: "Cursor for next page (null if no more items)",
      nullable: true,
      resolve: (result: GetActivityFeedOutput) => result.nextCursor,
    }),
    pagination: t.field({
      type: PaginationInfoType,
      description: "Pagination information",
      nullable: false,
      resolve: (result: GetActivityFeedOutput) => result.pagination,
    }),
  }),
});

/**
 * Moderation pagination info type
 */
export const ModerationPaginationInfoType = builder.objectType(
  "ModerationPaginationInfo",
  {
    description: "Pagination information for moderation view",
    fields: (t) => ({
      total: t.exposeInt("total", {
        description: "Total number of activities",
        nullable: false,
      }),
      page: t.exposeInt("page", {
        description: "Current page number",
        nullable: false,
      }),
      pageSize: t.exposeInt("pageSize", {
        description: "Items per page",
        nullable: false,
      }),
      totalPages: t.exposeInt("totalPages", {
        description: "Total number of pages",
        nullable: false,
      }),
      hasMore: t.exposeBoolean("hasMore", {
        description: "Whether there are more pages",
        nullable: false,
      }),
    }),
  },
);

/**
 * Moderation activity feed result type
 */
export const ActivityFeedModerationResultType = builder.objectType(
  "ActivityFeedModerationResult",
  {
    description: "Result of fetching activity feed for moderation",
    fields: (t) => ({
      activities: t.field({
        type: [ActivityType],
        description: "List of activities (including hidden)",
        nullable: false,
        resolve: (result: {
          activities: ActivityOutput[];
          pagination: {
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
            hasMore: boolean;
          };
        }) => result.activities,
      }),
      pagination: t.field({
        type: ModerationPaginationInfoType,
        description: "Pagination information",
        nullable: false,
        resolve: (result: {
          activities: ActivityOutput[];
          pagination: {
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
            hasMore: boolean;
          };
        }) => result.pagination,
      }),
    }),
  },
);

/**
 * Reaction counts type
 */
export const ReactionCountsType = builder.objectType("ReactionCounts", {
  description: "Counts for each reaction type",
  fields: (t) => ({
    heart: t.exposeInt("heart", {
      description: "Number of heart reactions",
      nullable: false,
    }),
    fire: t.exposeInt("fire", {
      description: "Number of fire reactions",
      nullable: false,
    }),
    clap: t.exposeInt("clap", {
      description: "Number of clap reactions",
      nullable: false,
    }),
    star: t.exposeInt("star", {
      description: "Number of star reactions",
      nullable: false,
    }),
  }),
});

/**
 * Reactions summary type
 */
export const ReactionsSummaryType = builder.objectType("ReactionsSummary", {
  description: "Summary of reactions on an activity",
  fields: (t) => ({
    total: t.exposeInt("total", {
      description: "Total number of reactions",
      nullable: false,
    }),
    counts: t.field({
      type: ReactionCountsType,
      description: "Counts per reaction type",
      nullable: false,
      resolve: (summary: AddReactionOutput["reactionsSummary"]) =>
        summary.counts,
    }),
    myReactions: t.field({
      type: [ReactionTypeEnum],
      description: "Current user's reactions",
      nullable: false,
      resolve: (summary: AddReactionOutput["reactionsSummary"]) =>
        summary.myReactions as ReactionType[],
    }),
  }),
});

/**
 * Toggle reaction result type
 */
export const ToggleReactionResultType = builder.objectType(
  "ToggleReactionResult",
  {
    description: "Result of toggling a reaction",
    fields: (t) => ({
      activityId: t.exposeID("activityId", {
        description: "Activity ID",
        nullable: false,
      }),
      reactionType: t.field({
        type: ReactionTypeEnum,
        description: "Reaction type that was toggled",
        nullable: false,
        resolve: (result: AddReactionOutput) =>
          result.reactionType.toUpperCase() as
            | "HEART"
            | "FIRE"
            | "CLAP"
            | "STAR",
      }),
      isActive: t.exposeBoolean("isActive", {
        description: "Whether reaction is now active",
        nullable: false,
      }),
      reactionsSummary: t.field({
        type: ReactionsSummaryType,
        description: "Updated reactions summary",
        nullable: false,
        resolve: (result: AddReactionOutput) => result.reactionsSummary,
      }),
    }),
  },
);

/**
 * Delete activity result type
 */
export const DeleteActivityResultType = builder.objectType(
  "DeleteActivityResult",
  {
    description: "Result of deleting an activity",
    fields: (t) => ({
      success: t.exposeBoolean("success", {
        description: "Whether deletion was successful",
        nullable: false,
      }),
    }),
  },
);

/**
 * Activity with hide info (for hide mutation result)
 */
export const HiddenActivityResultType = builder.objectType(
  "HiddenActivityResult",
  {
    description: "Activity result with hide information",
    fields: (t) => ({
      id: t.exposeID("id", {
        description: "Activity ID",
        nullable: false,
      }),
      tripId: t.exposeID("tripId", {
        description: "Trip ID",
        nullable: false,
      }),
      activityType: t.field({
        type: ActivityTypeEnum,
        description: "Type of activity",
        nullable: false,
        resolve: (activity: {
          id: string;
          tripId: string;
          activityType: string;
          title: string;
          description: string | null;
          imageUrl: string | null;
          isPinned: boolean;
          isHidden: boolean;
          hiddenAt: Date;
          hiddenReason: string | null;
          updatedAt: Date;
        }) =>
          activity.activityType.toUpperCase().replace(/_/g, "_") as
            | "CUSTOM"
            | "USER_POST"
            | "SUBMISSION"
            | "CHALLENGE_EVENT"
            | "RANK_CHANGE",
      }),
      title: t.exposeString("title", {
        description: "Activity title",
        nullable: false,
      }),
      description: t.exposeString("description", {
        description: "Activity description",
        nullable: true,
      }),
      imageUrl: t.exposeString("imageUrl", {
        description: "Activity image URL",
        nullable: true,
      }),
      isPinned: t.exposeBoolean("isPinned", {
        description: "Whether activity is pinned",
        nullable: false,
      }),
      isHidden: t.exposeBoolean("isHidden", {
        description: "Whether activity is hidden",
        nullable: false,
      }),
      hiddenAt: t.field({
        type: "DateTime",
        description: "When activity was hidden",
        nullable: false,
        resolve: (activity: {
          id: string;
          tripId: string;
          activityType: string;
          title: string;
          description: string | null;
          imageUrl: string | null;
          isPinned: boolean;
          isHidden: boolean;
          hiddenAt: Date;
          hiddenReason: string | null;
          updatedAt: Date;
        }) => activity.hiddenAt,
      }),
      hiddenReason: t.exposeString("hiddenReason", {
        description: "Reason for hiding",
        nullable: true,
      }),
      updatedAt: t.field({
        type: "DateTime",
        description: "When activity was last updated",
        nullable: false,
        resolve: (activity: {
          id: string;
          tripId: string;
          activityType: string;
          title: string;
          description: string | null;
          imageUrl: string | null;
          isPinned: boolean;
          isHidden: boolean;
          hiddenAt: Date;
          hiddenReason: string | null;
          updatedAt: Date;
        }) => activity.updatedAt,
      }),
    }),
  },
);

// =============================================================================
// Export
// =============================================================================

export { ActivityType as default };
