// =============================================================================
// Group Mutations
// =============================================================================

import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, requireAdmin } from "../../context.js";
import { GroupId, TripId, UserId } from "@mirai-app/domain";
import {
  CreateGroupInput,
  UpdateGroupInput,
  DeleteGroupInput,
  JoinGroupInput,
  RequestJoinGroupInput,
  RespondJoinRequestInput,
  AddGroupCoinsInput,
  BulkAssignUsersInput,
  CreateGroupResultType,
  UpdateGroupResultType,
  JoinGroupResultType,
  LeaveGroupResultType,
  JoinRequestResponseType,
  AddCoinsResultType,
  BulkAssignResultType,
} from "./types.js";

// =============================================================================
// Mutation Fields
// =============================================================================

builder.mutationFields((t) => ({
  // ==========================================================================
  // Group CRUD
  // ==========================================================================

  /**
   * Create a new group
   */
  createGroup: t.field({
    type: CreateGroupResultType,
    args: {
      input: t.arg({ type: CreateGroupInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        id: GroupId.unsafeCreate("placeholder"),
        tripId: TripId.unsafeCreate(args.input.tripId),
        name: args.input.name,
        description: args.input.description ?? null,
        code: "0000",
        image: args.input.image ?? null,
        coins: 0,
        organizer: null,
      };
    },
  }),

  /**
   * Update a group
   */
  updateGroup: t.field({
    type: UpdateGroupResultType,
    args: {
      input: t.arg({ type: UpdateGroupInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        id: GroupId.unsafeCreate(args.input.id),
        name: "Updated Group",
        description: null,
        image: null,
        organizerId: null,
      };
    },
  }),

  /**
   * Delete a group
   */
  deleteGroup: t.field({
    type: LeaveGroupResultType,
    args: {
      input: t.arg({ type: DeleteGroupInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        left: true,
        reassignedOrganizerId: null,
        groupDeleted: true,
      };
    },
  }),

  /**
   * Delete my own group
   */
  deleteMyGroup: t.field({
    type: LeaveGroupResultType,
    args: {
      groupId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        left: true,
        reassignedOrganizerId: null,
        groupDeleted: true,
      };
    },
  }),

  // ==========================================================================
  // Group Membership
  // ==========================================================================

  /**
   * Join a group
   */
  joinGroup: t.field({
    type: JoinGroupResultType,
    args: {
      input: t.arg({ type: JoinGroupInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        success: true,
        groupId: GroupId.unsafeCreate(args.input.groupId),
        joinedAsOrganizer: false,
      };
    },
  }),

  /**
   * Leave a group
   */
  leaveGroup: t.field({
    type: LeaveGroupResultType,
    args: {
      groupId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        left: true,
        reassignedOrganizerId: null,
        groupDeleted: false,
      };
    },
  }),

  /**
   * Request to join a group
   */
  requestJoinGroup: t.field({
    type: JoinGroupResultType,
    args: {
      input: t.arg({ type: RequestJoinGroupInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        success: true,
        groupId: GroupId.unsafeCreate(args.input.groupId),
        joinedAsOrganizer: false,
      };
    },
  }),

  /**
   * Cancel join request
   */
  cancelJoinRequest: t.field({
    type: LeaveGroupResultType,
    args: {
      groupId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        left: true,
        reassignedOrganizerId: null,
        groupDeleted: false,
      };
    },
  }),

  /**
   * Respond to join request
   */
  respondToJoinRequest: t.field({
    type: JoinRequestResponseType,
    args: {
      input: t.arg({ type: RespondJoinRequestInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        status: args.input.accept ? "ACCEPTED" as const : "REJECTED" as const,
        requestId: args.input.requestId,
      };
    },
  }),

  /**
   * Remove user from group
   */
  removeUserFromGroup: t.field({
    type: JoinGroupResultType,
    args: {
      userId: t.arg.string({ required: true }),
      tripId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        success: true,
        groupId: GroupId.unsafeCreate(args.tripId),
        joinedAsOrganizer: false,
      };
    },
  }),

  /**
   * Bulk assign users to group
   */
  bulkAssignUsers: t.field({
    type: BulkAssignResultType,
    args: {
      input: t.arg({ type: BulkAssignUsersInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        count: 0,
        participants: [],
      };
    },
  }),

  // ==========================================================================
  // Coin Management (Admin Only)
  // ==========================================================================

  /**
   * Add coins to group
   */
  addGroupCoins: t.field({
    type: AddCoinsResultType,
    args: {
      input: t.arg({ type: AddGroupCoinsInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      return {
        groupId: GroupId.unsafeCreate(args.input.groupId),
        amount: args.input.amount,
        previousCoins: 0,
        newCoins: args.input.amount,
      };
    },
  }),
}));

export const groupMutations = {};