import { builder } from "../builder";
import { GroupType, CreateGroupInput, UpdateGroupInput } from "../types/Group";
import {
  GetGroupUseCase,
  CreateGroupUseCase,
  UpdateGroupUseCase,
  type GetGroupInput,
  type CreateGroupInput as CreateGroupUseCaseInput,
  type UpdateGroupInput as UpdateGroupUseCaseInput,
} from "@mirai-app/use-cases";
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
      const useCase =
        context.container.resolve<GetGroupUseCase>("getGroupUseCase");
      const result = await useCase.execute({ groupId: args.id });

      if (result.kind === "err") {
        throw new Error(result.error);
      }

      return result.value;
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
      const groupRepository = context.container.resolve("groupRepository");
      return groupRepository.findByTripId(args.tripId);
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
      const groupRepository = context.container.resolve("groupRepository");
      return groupRepository.findByCode(args.code);
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
      const useCase =
        context.container.resolve<CreateGroupUseCase>("createGroupUseCase");

      const result = await useCase.execute({
        tripId: args.input.tripId,
        name: args.input.name,
        description: args.input.description,
        image: args.input.image,
        organizerId: args.input.organizerId,
      });

      if (result.kind === "err") {
        throw new Error(result.error);
      }

      return result.value;
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
      const useCase =
        context.container.resolve<UpdateGroupUseCase>("updateGroupUseCase");

      const result = await useCase.execute({
        groupId: args.id,
        name: args.input.name,
        description: args.input.description,
        image: args.input.image,
      });

      if (result.kind === "err") {
        throw new Error(result.error);
      }

      return result.value;
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

      const groupRepository = context.container.resolve("groupRepository");
      const group = await groupRepository.findByCode(args.code);

      if (!group) {
        throw new Error("Group not found");
      }

      // Add user to group logic would go here
      return group;
    },
  }),
}));
