import { GraphQLError } from "graphql";
import { builder } from "../../builder.js";
import { ActivityType, HiddenActivityResultType } from "./types.js";

/**
 * Create Custom Activity Input
 */
const CreateCustomActivityInput = builder.inputType(
  "CreateCustomActivityInput",
  {
    description: "Input for creating a custom activity",
    fields: (t) => ({
      tripId: t.field({ type: "ID", required: true }),
      title: t.field({ type: "String", required: true }),
      description: t.field({ type: "String" }),
      imageUrl: t.field({ type: "String" }),
      isPinned: t.field({ type: "Boolean" }),
    }),
  },
);

/**
 * Update Activity Input
 */
const UpdateActivityInput = builder.inputType("UpdateActivityInput", {
  description: "Input for updating an activity",
  fields: (t) => ({
    title: t.field({ type: "String" }),
    description: t.field({ type: "String" }),
    imageUrl: t.field({ type: "String" }),
  }),
});

/**
 * Hide Activity Input
 */
const HideActivityInput = builder.inputType("HideActivityInput", {
  description: "Input for hiding an activity",
  fields: (t) => ({
    activityId: t.field({ type: "ID", required: true }),
    reason: t.field({ type: "String", required: true }),
  }),
});

/**
 * Set Activity Pinned Input
 */
const SetActivityPinnedInput = builder.inputType("SetActivityPinnedInput", {
  description: "Input for setting an activity as pinned or unpinned",
  fields: (t) => ({
    activityId: t.field({ type: "ID", required: true }),
    isPinned: t.field({ type: "Boolean", required: true }),
  }),
});

/**
 * Toggle Activity Reaction Input
 */
const ToggleActivityReactionInput = builder.inputType(
  "ToggleActivityReactionInput",
  {
    description: "Input for toggling a reaction on an activity",
    fields: (t) => ({
      activityId: t.field({ type: "ID", required: true }),
      reactionType: t.field({
        type: "String",
        required: true,
        description: "One of: heart, fire, clap, star",
      }),
    }),
  },
);

/**
 * Activity Mutations
 */
builder.mutationFields((t) => ({
  /**
   * Create a custom activity
   */
  createCustomActivity: t.field({
    type: ActivityType,
    args: {
      input: t.arg({ type: CreateCustomActivityInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          tripId: string;
          title: string;
          description?: string | null;
          imageUrl?: string | null;
          isPinned?: boolean | null;
        };
      },
      ctx: {
        controllers: {
          activityFeedController: {
            createCustom: (
              input: unknown,
            ) => Promise<
              | { success: true; data: unknown }
              | { success: false; error: string }
            >;
          };
        };
        authContext?: {
          user: {
            id: string;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.activityFeedController;
      const result = await controller.createCustom({
        tripId: args.input.tripId,
        title: args.input.title,
        description: args.input.description ?? undefined,
        imageUrl: args.input.imageUrl ?? undefined,
        isPinned: args.input.isPinned ?? undefined,
        createdByAdmin: ctx.authContext?.user?.id,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Update an activity
   */
  updateActivity: t.field({
    type: ActivityType,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateActivityInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        id: string;
        input: {
          title?: string | null;
          description?: string | null;
          imageUrl?: string | null;
        };
      },
      ctx: {
        controllers: {
          activityFeedController: {
            update: (
              input: unknown,
            ) => Promise<
              | { success: true; data: unknown }
              | { success: false; error: string }
            >;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.activityFeedController;
      const result = await controller.update({
        activityId: args.id,
        title: args.input.title ?? undefined,
        description: args.input.description ?? undefined,
        imageUrl: args.input.imageUrl ?? undefined,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Delete an activity
   */
  deleteActivity: t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (
      _parent,
      args: { id: string },
      ctx: {
        controllers: {
          activityFeedController: {
            delete: (
              input: unknown,
            ) => Promise<
              | { success: true; data: { success: boolean } }
              | { success: false; error: string }
            >;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.activityFeedController;
      const result = await controller.delete({
        activityId: args.id,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return true;
    },
  }),

  /**
   * Hide an activity (moderator action)
   */
  hideActivity: t.field({
    type: HiddenActivityResultType,
    args: {
      input: t.arg({ type: HideActivityInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          activityId: string;
          reason: string;
        };
      },
      ctx: {
        controllers: {
          activityFeedController: {
            hide: (
              input: unknown,
            ) => Promise<
              | { success: true; data: unknown }
              | { success: false; error: string }
            >;
          };
        };
        authContext?: {
          user: {
            id: string;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.activityFeedController;
      const result = await controller.hide({
        activityId: args.input.activityId,
        hiddenByAdmin: ctx.authContext?.user?.id ?? "",
        reason: args.input.reason,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return {
        activity: result.data,
        success: true,
        message: null,
      };
    },
  }),

  /**
   * Unhide an activity (moderator action)
   */
  unhideActivity: t.field({
    type: HiddenActivityResultType,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (
      _parent,
      args: { id: string },
      ctx: {
        controllers: {
          activityFeedController: {
            unhide: (
              input: unknown,
            ) => Promise<
              | { success: true; data: unknown }
              | { success: false; error: string }
            >;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.activityFeedController;
      const result = await controller.unhide({
        activityId: args.id,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return {
        activity: result.data,
        success: true,
        message: null,
      };
    },
  }),

  /**
   * Set an activity as pinned or unpinned
   */
  setActivityPinned: t.field({
    type: ActivityType,
    args: {
      input: t.arg({ type: SetActivityPinnedInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          activityId: string;
          isPinned: boolean;
        };
      },
      ctx: {
        controllers: {
          activityFeedController: {
            setPinned: (
              input: unknown,
            ) => Promise<
              | { success: true; data: unknown }
              | { success: false; error: string }
            >;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.activityFeedController;
      const result = await controller.setPinned({
        activityId: args.input.activityId,
        isPinned: args.input.isPinned,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Toggle a reaction on an activity
   */
  toggleActivityReaction: t.field({
    type: ActivityType,
    args: {
      input: t.arg({ type: ToggleActivityReactionInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          activityId: string;
          reactionType: string;
        };
      },
      ctx: {
        controllers: {
          activityFeedController: {
            addReaction: (
              input: unknown,
            ) => Promise<
              | { success: true; data: unknown }
              | { success: false; error: string }
            >;
          };
        };
        authContext?: {
          user: {
            id: string;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.activityFeedController;

      if (!ctx.authContext?.user?.id) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const result = await controller.addReaction({
        activityId: args.input.activityId,
        userId: ctx.authContext.user.id,
        reactionType: args.input.reactionType.toLowerCase(),
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),
}));
