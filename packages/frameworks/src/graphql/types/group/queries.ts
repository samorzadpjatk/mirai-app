// =============================================================================
// Group Queries
// =============================================================================

import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, requireModerator } from "../../context.js";
import {
  GroupType,
  GroupWithDetailsType,
  GroupConnectionType,
  GroupRankingResultType,
  GroupJoinRequestType,
  GroupGallerySubmissionType,
} from "./types.js";
import { normalizePaginationArgs } from "../../utils/connections.js";

// =============================================================================
// Query Fields
// =============================================================================

builder.queryFields((t) => ({
  // ==========================================================================
  // Current User Group Queries
  // ==========================================================================

  /**
   * Get current user's group for a trip
   */
  myGroup: t.field({
    type: GroupWithDetailsType,
    nullable: true,
    args: {
      tripId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return null;
    },
  }),

  /**
   * Get current user's join request for a group
   */
  myJoinRequest: t.field({
    type: GroupJoinRequestType,
    nullable: true,
    args: {
      groupId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return null;
    },
  }),

  // ==========================================================================
  // Group List Queries
  // ==========================================================================

  /**
   * Get all groups for a trip (Relay connection)
   */
  groups: t.field({
    type: GroupConnectionType,
    args: {
      tripId: t.arg.string({ required: true }),
      first: t.arg.int(),
      after: t.arg.string(),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      };
    },
  }),

  /**
   * Get group by ID
   */
  group: t.field({
    type: GroupWithDetailsType,
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return null;
    },
  }),

  /**
   * Get group ranking for a trip
   */
  groupRanking: t.field({
    type: GroupRankingResultType,
    args: {
      tripId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        groups: [],
        currentDate: new Date(),
      };
    },
  }),

  /**
   * Get group list (moderator only)
   */
  groupList: t.field({
    type: [GroupType],
    args: {
      tripId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireModerator(context);
      return [];
    },
  }),

  /**
   * Get pending join requests for a group
   */
  pendingJoinRequests: t.field({
    type: [GroupJoinRequestType],
    args: {
      groupId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return [];
    },
  }),

  /**
   * Get group gallery submissions
   */
  groupGallery: t.field({
    type: [GroupGallerySubmissionType],
    args: {
      groupId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return [];
    },
  }),
}));

export const groupQueries = {};
