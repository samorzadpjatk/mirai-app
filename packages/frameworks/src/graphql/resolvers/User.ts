import { builder } from "../builder";
import { UserType, CreateUserInput, UpdateUserInput } from "../types/User";
import { UserRole } from "@mirai-app/domain";

/**
 * User Queries
 *
 * GraphQL query resolvers for User domain.
 * All resolvers use DI container to resolve use cases.
 */
builder.queryFields((t) => ({
  /**
   * Get a user by ID
   */
  user: t.field({
    type: UserType,
    nullable: true,
    description: "Get a user by ID",
    args: {
      id: t.arg.id({ required: true, description: "User ID" }),
    },
    authScopes: { authenticated: true },
    resolve: async (_, args, context) => {
      const controller = context.controllers.userController;
      const result = await controller.getById({ id: args.id });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),

  /**
   * Get the current authenticated user
   */
  me: t.field({
    type: UserType,
    nullable: true,
    description: "Get the currently authenticated user",
    authScopes: { authenticated: true },
    resolve: async (_, __, context) => {
      if (!context.authContext) {
        return null;
      }

      const controller = context.controllers.userController;
      const result = await controller.getById({
        id: context.authContext.userId,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),

  /**
   * List all users (admin only)
   */
  users: t.field({
    type: [UserType],
    description: "List all users (admin only)",
    args: {
      limit: t.arg.int({ required: false, defaultValue: 20 }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    authScopes: { admin: true },
    resolve: async (_, args, context) => {
      const controller = context.controllers.userController;
      const result = await controller.list({
        limit: args.limit ?? 20,
        offset: args.offset ?? 0,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),
}));

/**
 * User Mutations
 *
 * GraphQL mutation resolvers for User domain.
 */
builder.mutationFields((t) => ({
  /**
   * Create a new user
   */
  createUser: t.field({
    type: UserType,
    description: "Create a new user",
    args: {
      input: t.arg({ type: CreateUserInput, required: true }),
    },
    authScopes: { public: true }, // Allow public registration
    resolve: async (_, args, context) => {
      const controller = context.controllers.userController;

      const roleMap: Record<string, UserRole> = {
        USER: UserRole.USER,
        ADMIN: UserRole.ADMIN,
        MODERATOR: UserRole.MODERATOR,
        SERVICE: UserRole.SERVICE,
      };

      const result = await controller.create({
        authUserId: args.input.authUserId,
        firstName: args.input.firstName,
        lastName: args.input.lastName,
        role: roleMap[args.input.role ?? "USER"] ?? UserRole.USER,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),

  /**
   * Update the current user
   */
  updateMe: t.field({
    type: UserType,
    description: "Update the current user's profile",
    args: {
      input: t.arg({ type: UpdateUserInput, required: true }),
    },
    authScopes: { authenticated: true },
    resolve: async (_, args, context) => {
      if (!context.authContext) {
        throw new Error("Not authenticated");
      }

      const controller = context.controllers.userController;

      const result = await controller.update({
        userId: context.authContext.userId,
        firstName: args.input.firstName ?? undefined,
        lastName: args.input.lastName ?? undefined,
        hasAvatar: args.input.hasAvatar ?? undefined,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),

  /**
   * Update a user (admin only)
   */
  updateUser: t.field({
    type: UserType,
    description: "Update any user (admin only)",
    args: {
      id: t.arg.id({ required: true, description: "User ID to update" }),
      input: t.arg({ type: UpdateUserInput, required: true }),
    },
    authScopes: { admin: true },
    resolve: async (_, args, context) => {
      const controller = context.controllers.userController;

      const result = await controller.update({
        userId: args.id,
        firstName: args.input.firstName ?? undefined,
        lastName: args.input.lastName ?? undefined,
        hasAvatar: args.input.hasAvatar ?? undefined,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),
}));
