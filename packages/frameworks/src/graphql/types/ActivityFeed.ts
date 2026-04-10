import { builder } from "../builder";

/**
 * Activity Reaction Type
 */
export const ActivityReactionType = builder.objectType<"ActivityReaction">(
  "ActivityReaction",
  {
    description: "A reaction to an activity feed item",
    fields: (t) => ({
      id: t.exposeID("id"),
      activityId: t.exposeID("activityId"),
      userId: t.exposeID("userId"),
      reactionType: t.exposeString("reactionType", {
        description: "Type of reaction (emoji or predefined type)",
      }),
      createdAt: t.field({
        type: "DateTime",
        resolve: (reaction) => reaction.createdAt,
      }),
    }),
  },
);

/**
 * Activity Feed Type (Pothos)
 *
 * GraphQL type definition for ActivityFeed entity.
 */
export const ActivityFeedType = builder.objectType<"ActivityFeed">(
  "ActivityFeed",
  {
    description: "An item in the activity feed",
    fields: (t) => ({
      id: t.exposeID("id", { description: "Unique activity identifier" }),

      tripId: t.exposeID("tripId", {
        description: "ID of the trip this activity belongs to",
      }),

      activityType: t.exposeString("activityType", {
        description:
          "Type of activity (submission, challenge, rank_change, post, etc.)",
      }),

      title: t.exposeString("title", { description: "Activity title" }),

      description: t.exposeString("description", {
        description: "Activity description",
        nullable: true,
      }),

      imageUrl: t.exposeString("imageUrl", {
        description: "URL to activity image",
        nullable: true,
      }),

      isPinned: t.exposeBoolean("isPinned", {
        description: "Whether this activity is pinned to the top",
      }),

      isHidden: t.exposeBoolean("isHidden", {
        description: "Whether this activity is hidden from the feed",
      }),

      hiddenAt: t.field({
        type: "DateTime",
        description: "When the activity was hidden",
        nullable: true,
        resolve: (activity) => activity.hiddenAt,
      }),

      hiddenReason: t.exposeString("hiddenReason", {
        description: "Reason for hiding the activity",
        nullable: true,
      }),

      reactions: t.field({
        type: [ActivityReactionType],
        description: "Reactions to this activity",
        resolve: (activity) => activity.reactions || [],
      }),

      createdAt: t.field({
        type: "DateTime",
        description: "When the activity was created",
        resolve: (activity) => activity.createdAt,
      }),

      updatedAt: t.field({
        type: "DateTime",
        description: "When the activity was last updated",
        resolve: (activity) => activity.updatedAt,
      }),

      createdByAdmin: t.exposeID("createdByAdmin", {
        description: "ID of the admin who created this activity",
        nullable: true,
      }),
    }),
  },
);

/**
 * Activity Feed Input Types
 */
export const CreateActivityInput = builder.inputType("CreateActivityInput", {
  description: "Input for creating a new activity feed item",
  fields: (t) => ({
    tripId: t.string({ required: true }),
    activityType: t.string({ required: true }),
    title: t.string({
      required: true,
      validate: { minLength: 1, maxLength: 255 },
    }),
    description: t.string({ required: false }),
    imageUrl: t.string({ required: false }),
  }),
});

export const AddReactionInput = builder.inputType("AddReactionInput", {
  description: "Input for adding a reaction to an activity",
  fields: (t) => ({
    activityId: t.string({ required: true }),
    reactionType: t.string({ required: true }),
  }),
});
