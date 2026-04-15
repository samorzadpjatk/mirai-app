import { builder } from "../builder";
import { GroupType, CreateGroupInput, UpdateGroupInput } from "../types/Group";
import {
  getGroupUseCase,
  createGroupUseCase,
  updateGroupUseCase,
  type GetGroupInput,
  type CreateGroupInput as CreateGroupUseCaseInput,
  type UpdateGroupInput as UpdateGroupUseCaseInput,
  GetGroupNotFoundError,
  GroupCodeAlreadyExistsError,
  GroupCreationError,
  UpdateGroupNotFoundError,
  UpdateGroupDeletedError,
  UpdateGroupValidationError,
} from "@mirai-app/use-cases";
import { GroupRepositoryTag } from "@mirai-app/use-cases/ports/GroupRepository";
import { Effect, Either } from "effect";
import { GroupStatus } from "@mirai-app/domain";

/**
 * Group Queries
 */
builder.queryFields((t) => ({
  group: t.field({
    type: GroupType,
    nullable: true,
    description: "Get a group by ID",
    args: {
      id: t.arg.id({ required: true, description: "Group ID" }),
    },
    authScopes: { authenticated: true },
    resolve: async (_, args, context) => {
      const controller = context.controllers.groupController;
      const result = await controller.getById({ id: args.id });

      if (!result.success) {
        if (result.error.toLowerCase().includes("not found")) {
          return null;
        }
        throw new Error(result.error);
      }

      return result.data;
    },
  }),

  groupsByTrip: t.field({
    type: [GroupType],
    description: "Get all groups for a trip",
    args: {
      tripId: t.arg.id({ required: true, description: "Trip ID" }),
    },
    authScopes: { authenticated: true },
    resolve: async (_, args, context) => {
      const controller = context.controllers.groupController;
      const result = await controller.list({ tripId: args.tripId });

      if (!result.success) {
        return [];
      }

      return result.data;
    },
  }),

  groupsByCode: t.field({
    type: GroupType,
    nullable: true,
    description: "Find a group by its join code",
    args: {
      code: t.arg.string({ required: true, description: "Group join code" }),
    },
    authScopes: { authenticated: true },
    resolve: async (_, args, context) => {
      const controller = context.controllers.groupController;
      const result = await controller.getByCode({ code: args.code });

      if (!result.success) {
        if (result.error.toLowerCase().includes("not found")) {
          return null;
        }
        throw new Error(result.error);
      }

      return result.data;
    },
  }),
}));

/**
 * Group Mutations
 */
builder.mutationFields((t) => ({
  createGroup: t.field({
    type: GroupType,
    description: "Create a new group",
    args: {
      input: t.arg({ type: CreateGroupInput, required: true }),
    },
    authScopes: { authenticated: true },
    resolve: async (_, args, context) => {
      const controller = context.controllers.groupController;
      const result = await controller.create({
        tripId: args.input.tripId,
        name: args.input.name,
        description: args.input.description,
        image: args.input.image,
        organizerId: args.input.organizerId,
        code: args.input.code ?? args.input.tripId.slice(0, 8).toUpperCase(),
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),

  updateGroup: t.field({
    type: GroupType,
    description: "Update a group",
    args: {
      id: t.arg.id({ required: true, description: "Group ID" }),
      input: t.arg({ type: UpdateGroupInput, required: true }),
    },
    authScopes: { authenticated: true },
    resolve: async (_, args, context) => {
      const controller = context.controllers.groupController;
      const result = await controller.update({
        id: args.id,
        name: args.input.name,
        description: args.input.description,
        image: args.input.image,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),

  joinGroupByCode: t.field({
    type: GroupType,
    description: "Join a group using its code",
    args: {
      code: t.arg.string({ required: true, description: "Group join code" }),
    },
    authScopes: { authenticated: true },
    resolve: async (_, args, context) => {
      if (!context.authContext) {
        throw new Error("Not authenticated");
      }

      const controller = context.controllers.groupController;
      const result = await controller.getByCode({ code: args.code });

      if (!result.success) {
        throw new Error("Group not found");
      }

      // Add user to group logic would go here
      return result.data;
    },
  }),
}));
