import { builder } from "../../builder.js";
import {
  GroupType,
  GroupConnectionType,
  GroupMemberConnectionType,
  GroupJoinRequestConnectionType,
  buildGroupConnection,
  buildGroupMemberConnection,
  buildGroupJoinRequestConnection,
} from "./types.js";
import type {
  GroupDTO,
  GroupMemberDTO,
  GroupJoinRequestDTO,
} from "@mirai-app/use-cases";

/**
 * Group Queries
 */
builder.queryFields((t) => ({
  /**
   * Get a single group by ID
   */
  group: t.field({
    type: GroupType,
    args: {
      id: t.arg.id({
        required: true,
        description: "ID of the group to fetch",
      }),
    },
    resolve: async (
      _parent,
      args: { id: string },
      ctx: {
        controllers: {
          groupController: {
            getById: (input: { id: string }) => Promise<{
              success: boolean;
              data?: GroupDTO;
              error?: string;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.groupController;
      const result = await controller.getById({ id: args.id });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Group not found");
      }

      return result.data;
    },
  }),

  /**
   * Find groups for a specific trip with cursor-based pagination
   */
  groupsByTrip: t.field({
    type: GroupConnectionType,
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to fetch groups for",
      }),
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        tripId: string;
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          groupController: {
            getByTripId: (input: {
              tripId: string;
              limit: number;
              after: { id: string; createdAt: Date } | null;
            }) => Promise<{
              items: GroupDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.groupController;
      const first = args.first ?? 20;
      const afterCursor = args.after
        ? JSON.parse(Buffer.from(args.after, "base64url").toString("utf-8"))
        : null;

      const result = await controller.getByTripId({
        tripId: args.tripId,
        limit: first,
        after: afterCursor,
      });

      return buildGroupConnection(result.items, result.hasMore, !!afterCursor);
    },
  }),

  /**
   * Get the current user's group for a specific trip
   */
  myGroup: t.field({
    type: GroupType,
    nullable: true,
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to fetch the user's group for",
      }),
    },
    resolve: async (
      _parent,
      args: { tripId: string },
      ctx: {
        authContext?: { userId: string };
        controllers: {
          groupController: {
            getMyGroup: (input: { tripId: string; userId: string }) => Promise<{
              success: boolean;
              data?: GroupDTO | null;
              error?: string;
            }>;
          };
        };
      },
    ) => {
      if (!ctx.authContext) {
        throw new Error("Authentication required");
      }

      const controller = ctx.controllers.groupController;
      const result = await controller.getMyGroup({
        tripId: args.tripId,
        userId: ctx.authContext.userId,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch group");
      }

      return result.data ?? null;
    },
  }),

  /**
   * Get members of a specific group with cursor-based pagination
   */
  groupMembers: t.field({
    type: GroupMemberConnectionType,
    args: {
      groupId: t.arg.id({
        required: true,
        description: "ID of the group to fetch members for",
      }),
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        groupId: string;
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          groupController: {
            getMembers: (input: {
              groupId: string;
              limit: number;
              after: { id: string; createdAt: Date } | null;
            }) => Promise<{
              items: GroupMemberDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.groupController;
      const first = args.first ?? 20;
      const afterCursor = args.after
        ? JSON.parse(Buffer.from(args.after, "base64url").toString("utf-8"))
        : null;

      const result = await controller.getMembers({
        groupId: args.groupId,
        limit: first,
        after: afterCursor,
      });

      return buildGroupMemberConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),

  /**
   * Get pending join requests for a specific group
   */
  groupJoinRequests: t.field({
    type: GroupJoinRequestConnectionType,
    args: {
      groupId: t.arg.id({
        required: true,
        description: "ID of the group to fetch join requests for",
      }),
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        groupId: string;
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        authContext?: { userId: string };
        controllers: {
          groupController: {
            getJoinRequests: (input: {
              groupId: string;
              limit: number;
              after: { id: string; createdAt: Date } | null;
              userId: string;
            }) => Promise<{
              items: GroupJoinRequestDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      if (!ctx.authContext) {
        throw new Error("Authentication required");
      }

      const controller = ctx.controllers.groupController;
      const first = args.first ?? 20;
      const afterCursor = args.after
        ? JSON.parse(Buffer.from(args.after, "base64url").toString("utf-8"))
        : null;

      const result = await controller.getJoinRequests({
        groupId: args.groupId,
        limit: first,
        after: afterCursor,
        userId: ctx.authContext.userId,
      });

      return buildGroupJoinRequestConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),
}));
