// =============================================================================
// Group Mutations - Effect DI Pattern
// =============================================================================

import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, requireAdmin, runEffect } from "../../context.js";
import { mapErrorToGraphQL } from "../../errors.js";
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

// Import use cases
import {
  CreateGroupUseCase,
  UpdateGroupUseCase,
  DeleteGroupUseCase,
  DeleteMyGroupUseCase,
  JoinGroupUseCase,
  LeaveMyGroupUseCase,
  RequestToJoinGroupUseCase,
  CancelMyJoinRequestUseCase,
  RespondToJoinRequestUseCase,
  RemoveUserFromGroupUseCase,
  BulkAssignUsersToGroupUseCase,
  AddCoinsToGroupUseCase,
} from "@mirai-app/use-cases/group";

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
      const auth = requireAuth(context);

      const useCase = new CreateGroupUseCase();
      const effect = useCase.execute({
        tripId: args.input.tripId,
        name: args.input.name,
        description: args.input.description ?? undefined,
        image: args.input.image ?? undefined,
        creatorId: auth.userId,
        code: "0000", // Code generation should be handled by use case or domain
      });

      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
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
      const auth = requireAuth(context);

      const useCase = new UpdateGroupUseCase();
      const effect = useCase.execute({
        groupId: args.input.id,
        tripId: args.input.tripId,
        userId: auth.userId,
        isAdmin: auth.role === "ADMIN" || auth.role === "MODERATOR",
        name: args.input.name ?? undefined,
        description: args.input.description ?? undefined,
        image: args.input.image ?? undefined,
        organizerId: args.input.organizerId ?? undefined,
      });

      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
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
      const auth = requireAdmin(context);

      const useCase = new DeleteGroupUseCase();
      const effect = useCase.execute({
        groupId: args.input.id,
      });

      return runEffect(context, effect)
        .then(() => ({
          left: true,
          reassignedOrganizerId: null,
          groupDeleted: true,
        }))
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
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
      const auth = requireAuth(context);

      const useCase = new DeleteMyGroupUseCase();
      const effect = useCase.execute({
        groupId: args.groupId,
        userId: auth.userId,
      });

      return runEffect(context, effect)
        .then(() => ({
          left: true,
          reassignedOrganizerId: null,
          groupDeleted: true,
        }))
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
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
      const auth = requireAdmin(context);

      const useCase = new JoinGroupUseCase();
      const effect = useCase.execute({
        groupId: args.input.groupId,
        tripId: args.input.tripId,
        userId: auth.userId,
      });

      return runEffect(context, effect)
        .then(() => ({
          success: true,
          groupId: GroupId.unsafeCreate(args.input.groupId),
          joinedAsOrganizer: false,
        }))
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
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
      const auth = requireAuth(context);

      const useCase = new LeaveMyGroupUseCase();
      const effect = useCase.execute({
        groupId: args.groupId,
        userId: auth.userId,
      });

      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
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
      const auth = requireAuth(context);

      const useCase = new RequestToJoinGroupUseCase();
      const effect = useCase.execute({
        groupId: args.input.groupId,
        userId: auth.userId,
      });

      return runEffect(context, effect)
        .then(() => ({
          success: true,
          groupId: GroupId.unsafeCreate(args.input.groupId),
          joinedAsOrganizer: false,
        }))
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
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
      const auth = requireAuth(context);

      const useCase = new CancelMyJoinRequestUseCase();
      const effect = useCase.execute({
        groupId: args.groupId,
        userId: auth.userId,
      });

      return runEffect(context, effect)
        .then(() => ({
          left: true,
          reassignedOrganizerId: null,
          groupDeleted: false,
        }))
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
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
      const auth = requireAuth(context);

      const useCase = new RespondToJoinRequestUseCase();
      const effect = useCase.execute({
        requestId: args.input.requestId,
        userId: auth.userId,
        decision: args.input.accept ? "ACCEPT" : "REJECT",
      });

      return runEffect(context, effect)
        .then(() => ({
          status: args.input.accept ? "ACCEPTED" as const : "REJECTED" as const,
          requestId: args.input.requestId,
        }))
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
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
      const auth = requireAdmin(context);

      const useCase = new RemoveUserFromGroupUseCase();
      const effect = useCase.execute({
        userId: args.userId,
        tripId: args.tripId,
        requestingUserId: auth.userId,
        isAdmin: true,
      });

      return runEffect(context, effect)
        .then(() => ({
          success: true,
          groupId: GroupId.unsafeCreate(args.tripId), // This is incorrect but maintains backward compat
          joinedAsOrganizer: false,
        }))
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
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
      const auth = requireAdmin(context);

      const useCase = new BulkAssignUsersToGroupUseCase();
      const effect = useCase.execute({
        tripId: args.input.tripId,
        groupId: args.input.groupId,
        userIds: args.input.userIds,
        requestingUserId: auth.userId,
      });

      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
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
      const auth = requireAdmin(context);

      const useCase = new AddCoinsToGroupUseCase();
      const effect = useCase.execute({
        groupId: args.input.groupId,
        tripId: args.input.tripId,
        amount: args.input.amount,
        adminId: auth.userId,
      });

      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),
}));

export const groupMutations = {};