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
 * Helper to create Effect repository from container repository
 */
const createEffectRepository = (container: any) => ({
  create: (group: any) =>
    Effect.promise(() => container.groupRepository.create(group)),
  findById: (id: string) =>
    Effect.promise(() => container.groupRepository.findById(id)),
  findByCode: (code: string) =>
    Effect.promise(() => container.groupRepository.findByCode(code)),
  findByTripId: (tripId: string) =>
    Effect.promise(() => container.groupRepository.findByTripId(tripId)),
  findByOrganizerId: (organizerId: string) =>
    Effect.promise(() =>
      container.groupRepository.findByOrganizerId(organizerId),
    ),
  findByStatus: (status: GroupStatus) =>
    Effect.promise(() => container.groupRepository.findByStatus(status)),
  findByTripIdAndStatus: (tripId: string, status: GroupStatus) =>
    Effect.promise(() =>
      container.groupRepository.findByTripIdAndStatus(tripId, status),
    ),
  findAll: (options?: { limit?: number; offset?: number }) =>
    Effect.promise(() => container.groupRepository.findAll(options)),
  update: (group: any) =>
    Effect.promise(() => container.groupRepository.update(group)),
  delete: (id: string) =>
    Effect.promise(() => container.groupRepository.delete(id)),
  exists: (id: string) =>
    Effect.promise(() => container.groupRepository.exists(id)),
  countByTripId: (tripId: string) =>
    Effect.promise(() => container.groupRepository.countByTripId(tripId)),
});

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
      const input: GetGroupInput = { groupId: args.id };
      const effectRepo = createEffectRepository(context.container);

      const program = getGroupUseCase(input).pipe(
        Effect.provideService(GroupRepositoryTag, effectRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));

      if (Either.isLeft(either)) {
        if (either.left instanceof GetGroupNotFoundError) {
          return null;
        }
        throw new Error(either.left.message);
      }

      return either.right;
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
      const input: CreateGroupUseCaseInput = {
        tripId: args.input.tripId,
        name: args.input.name,
        description: args.input.description,
        image: args.input.image,
        organizerId: args.input.organizerId,
        code: args.input.code ?? args.input.tripId.slice(0, 8).toUpperCase(),
      };

      const effectRepo = createEffectRepository(context.container);

      const program = createGroupUseCase(input).pipe(
        Effect.provideService(GroupRepositoryTag, effectRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));

      if (Either.isLeft(either)) {
        if (either.left instanceof GroupCodeAlreadyExistsError) {
          throw new Error("Group code already exists");
        }
        if (either.left instanceof GroupCreationError) {
          throw new Error(`Failed to create group: ${either.left.message}`);
        }
        throw new Error(either.left.message);
      }

      return either.right;
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
      const input: UpdateGroupUseCaseInput = {
        groupId: args.id,
        name: args.input.name,
        description: args.input.description,
        image: args.input.image,
      };

      const effectRepo = createEffectRepository(context.container);

      const program = updateGroupUseCase(input).pipe(
        Effect.provideService(GroupRepositoryTag, effectRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));

      if (Either.isLeft(either)) {
        if (either.left instanceof UpdateGroupNotFoundError) {
          throw new Error("Group not found");
        }
        if (either.left instanceof UpdateGroupDeletedError) {
          throw new Error("Cannot update a deleted group");
        }
        if (either.left instanceof UpdateGroupValidationError) {
          throw new Error(`Validation error: ${either.left.message}`);
        }
        throw new Error(either.left.message);
      }

      return either.right;
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
