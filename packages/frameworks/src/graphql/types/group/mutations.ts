import { GraphQLError } from "graphql";
import { builder } from "../../builder.js";
import {
  GroupType,
  GroupMemberType,
  GroupJoinRequestType,
  JoinRequestStatusEnum,
} from "./types.js";

/**
 * Create Group Input
 */
const CreateGroupInput = builder.inputType("CreateGroupInput", {
  description: "Input for creating a new group",
  fields: (t) => ({
    tripId: t.field({ type: "ID", required: true }),
    name: t.field({ type: "String", required: true }),
    description: t.field({ type: "String" }),
    image: t.field({ type: "String" }),
    organizerId: t.field({ type: "ID", required: true }),
    code: t.field({ type: "String", required: true }),
    coins: t.field({ type: "Int", required: true }),
  }),
});

/**
 * Update Group Input
 */
const UpdateGroupInput = builder.inputType("UpdateGroupInput", {
  description: "Input for updating a group",
  fields: (t) => ({
    name: t.field({ type: "String" }),
    description: t.field({ type: "String" }),
    image: t.field({ type: "String" }),
  }),
});

/**
 * Join Group Input
 */
const JoinGroupInput = builder.inputType("JoinGroupInput", {
  description: "Input for joining a group",
  fields: (t) => ({
    groupId: t.field({ type: "ID", required: true }),
    userId: t.field({ type: "ID", required: true }),
  }),
});

/**
 * Leave Group Input
 */
const LeaveGroupInput = builder.inputType("LeaveGroupInput", {
  description: "Input for leaving a group",
  fields: (t) => ({
    groupId: t.field({ type: "ID", required: true }),
    userId: t.field({ type: "ID", required: true }),
  }),
});

/**
 * Create Group Join Request Input
 */
const CreateGroupJoinRequestInput = builder.inputType(
  "CreateGroupJoinRequestInput",
  {
    description: "Input for creating a group join request",
    fields: (t) => ({
      groupId: t.field({ type: "ID", required: true }),
      userId: t.field({ type: "ID", required: true }),
      message: t.field({ type: "String" }),
    }),
  },
);

/**
 * Approve Group Join Request Input
 */
const ApproveGroupJoinRequestInput = builder.inputType(
  "ApproveGroupJoinRequestInput",
  {
    description: "Input for approving a group join request",
    fields: (t) => ({
      requestId: t.field({ type: "ID", required: true }),
      groupId: t.field({ type: "ID", required: true }),
      userId: t.field({ type: "ID", required: true }),
    }),
  },
);

/**
 * Reject Group Join Request Input
 */
const RejectGroupJoinRequestInput = builder.inputType(
  "RejectGroupJoinRequestInput",
  {
    description: "Input for rejecting a group join request",
    fields: (t) => ({
      requestId: t.field({ type: "ID", required: true }),
      groupId: t.field({ type: "ID", required: true }),
      userId: t.field({ type: "ID", required: true }),
    }),
  },
);

/**
 * Group Mutations
 */
builder.mutationFields((t) => ({
  /**
   * Create a new group
   */
  createGroup: t.field({
    type: GroupType,
    args: {
      input: t.arg({ type: CreateGroupInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          tripId: string;
          name: string;
          description?: string | null;
          image?: string | null;
          organizerId: string;
          code: string;
          coins: number;
        };
      },
      ctx,
    ) => {
      const controller = ctx.controllers.groupController;
      const result = await controller.create({
        tripId: args.input.tripId,
        name: args.input.name,
        description: args.input.description ?? undefined,
        image: args.input.image ?? undefined,
        organizerId: args.input.organizerId,
        code: args.input.code,
        coins: args.input.coins,
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
   * Update a group
   */
  updateGroup: t.field({
    type: GroupType,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateGroupInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        id: string;
        input: {
          name?: string | null;
          description?: string | null;
          image?: string | null;
        };
      },
      ctx,
    ) => {
      const controller = ctx.controllers.groupController;
      const result = await controller.update({
        groupId: args.id,
        name: args.input.name ?? undefined,
        description: args.input.description ?? undefined,
        image: args.input.image ?? undefined,
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
   * Delete a group
   */
  deleteGroup: t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args: { id: string }, ctx) => {
      const controller = ctx.controllers.groupController;
      const result = await controller.delete({
        id: args.id,
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
   * Join a group
   */
  joinGroup: t.field({
    type: GroupMemberType,
    args: {
      input: t.arg({ type: JoinGroupInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          groupId: string;
          userId: string;
        };
      },
      ctx,
    ) => {
      const controller = ctx.controllers.groupController;
      const result = await controller.join({
        groupId: args.input.groupId,
        userId: args.input.userId,
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
   * Leave a group
   */
  leaveGroup: t.field({
    type: "Boolean",
    args: {
      input: t.arg({ type: LeaveGroupInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          groupId: string;
          userId: string;
        };
      },
      ctx,
    ) => {
      const controller = ctx.controllers.groupController;
      const result = await controller.leave({
        groupId: args.input.groupId,
        userId: args.input.userId,
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
   * Create a group join request
   */
  createGroupJoinRequest: t.field({
    type: GroupJoinRequestType,
    args: {
      input: t.arg({ type: CreateGroupJoinRequestInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          groupId: string;
          userId: string;
          message?: string | null;
        };
      },
      ctx,
    ) => {
      const controller = ctx.controllers.groupController;
      const result = await controller.createJoinRequest({
        groupId: args.input.groupId,
        userId: args.input.userId,
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
   * Approve a group join request
   */
  approveGroupJoinRequest: t.field({
    type: GroupJoinRequestType,
    args: {
      input: t.arg({ type: ApproveGroupJoinRequestInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          requestId: string;
          groupId: string;
          userId: string;
        };
      },
      ctx,
    ) => {
      const controller = ctx.controllers.groupController;
      const result = await controller.approveJoinRequest({
        groupId: args.input.groupId,
        userId: args.input.userId,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return {
        id: args.input.requestId,
        groupId: args.input.groupId,
        userId: args.input.userId,
        status: "APPROVED",
        requestedAt: new Date(),
        message: null,
      };
    },
  }),

  /**
   * Reject a group join request
   */
  rejectGroupJoinRequest: t.field({
    type: GroupJoinRequestType,
    args: {
      input: t.arg({ type: RejectGroupJoinRequestInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          requestId: string;
          groupId: string;
          userId: string;
        };
      },
      ctx,
    ) => {
      const controller = ctx.controllers.groupController;
      const result = await controller.rejectJoinRequest({
        groupId: args.input.groupId,
        userId: args.input.userId,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return {
        id: args.input.requestId,
        groupId: args.input.groupId,
        userId: args.input.userId,
        status: "REJECTED",
        requestedAt: new Date(),
        message: null,
      };
    },
  }),
}));
