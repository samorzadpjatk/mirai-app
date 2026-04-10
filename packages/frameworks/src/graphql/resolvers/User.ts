import { builder } from "../builder";
import {
  UserType,
  CreateUserInput,
  UpdateUserInput,
  ErrorType,
} from "../types/User";
import {
  GetUserUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  type GetUserInput,
  type CreateUserInput as CreateUserUseCaseInput,
  type UpdateUserInput as UpdateUserUseCaseInput,
} from "@mirai-app/use-cases";
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
      const useCase =
        context.container.resolve<GetUserUseCase>("getUserUseCase");
      const result = await useCase.execute({ userId: args.id });

      if (result.kind === "err") {
        throw new Error(result.error);
      }

      return result.value;
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

      const useCase =
        context.container.resolve<GetUserUseCase>("getUserUseCase");
      const result = await useCase.execute({
        userId: context.authContext.userId,
      });

      if (result.kind === "err") {
        throw new Error(result.error);
      }

      return result.value;
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
      // Note: This would need a ListUsersUseCase
      // For now, we return an empty array
      // In production, implement the use case in use-cases layer
      const userRepository = context.container.resolve("userRepository");
      return userRepository.findAll({
        limit: args.limit ?? 20,
        offset: args.offset ?? 0,
      });
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
      const useCase =
        context.container.resolve<CreateUserUseCase>("createUserUseCase");

      const roleMap: Record<string, UserRole> = {
        USER: UserRole.USER,
        ADMIN: UserRole.ADMIN,
        MODERATOR: UserRole.MODERATOR,
        SERVICE: UserRole.SERVICE,
      };

      const result = await useCase.execute({
        authUserId: args.input.authUserId,
        firstName: args.input.firstName,
        lastName: args.input.lastName,
        role: roleMap[args.input.role ?? "USER"] ?? UserRole.USER,
      });

      if (result.kind === "err") {
        throw new Error(result.error);
      }

      return result.value;
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

      const useCase =
        context.container.resolve<UpdateUserUseCase>("updateUserUseCase");

      const result = await useCase.execute({
        userId: context.authContext.userId,
        firstName: args.input.firstName ?? undefined,
        lastName: args.input.lastName ?? undefined,
        hasAvatar: args.input.hasAvatar ?? undefined,
      });

      if (result.kind === "err") {
        throw new Error(result.error);
      }

      return result.value;
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
      const useCase =
        context.container.resolve<UpdateUserUseCase>("updateUserUseCase");

      const result = await useCase.execute({
        userId: args.id,
        firstName: args.input.firstName ?? undefined,
        lastName: args.input.lastName ?? undefined,
        hasAvatar: args.input.hasAvatar ?? undefined,
      });

      if (result.kind === "err") {
        throw new Error(result.error);
      }

      return result.value;
    },
  }),
}));
