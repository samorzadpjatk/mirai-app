/**
 * User GraphQL Resolvers
 *
 * Resolvers for User domain queries and mutations.
 * Maps use case outputs to GraphQL responses with proper error handling.
 *
 * ## Queries
 *
 * - user(id: ID!): User - Get user by ID (authenticated)
 * - users(limit: Int, offset: Int): [User!]! - List all users (admin only)
 * - me: User - Get current authenticated user
 *
 * ## Mutations
 *
 * - createUser(input: CreateUserInput!): UserCreateResult - Create new user (admin only)
 * - updateUser(input: UpdateUserInput!): UserUpdateResult - Update user (authenticated)
 *
 * @module User/resolvers
 */

import { builder } from "../builder";
import type {
  GetUserOutput,
  CreateUserOutput,
  UpdateUserOutput,
} from "@mirai-app/use-cases";
import { UserController } from "@mirai-app/adapters";
import { requireAuth, requireAdmin } from "../utils/auth-helpers";
import { handleResult, mapErrorToGraphQL } from "../utils/error-mapper";
import {
  UserCreateResultType,
  UserUpdateResultType,
  CreateUserInput,
  UpdateUserInput,
} from "../types/User";

// =============================================================================
// Types
// =============================================================================

/**
 * Input type for user query
 */
const UserInput = builder.inputType("UserInput", {
  description: "Input for fetching a user by ID",
  fields: (t) => ({
    id: t.id({
      description: "Unique user ID",
      required: true,
    }),
  }),
});

// =============================================================================
// Query Fields
// =============================================================================

/**
 * Query: user(id: ID!) - Get user by ID
 *
 * Requires authentication. Users can view any user's profile.
 */
builder.queryField("user", (t) =>
  t.field({
    description: "Get a user by their unique ID",
    type: "User",
    nullable: true,
    args: {
      id: t.arg.id({
        description: "User ID to fetch",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context): Promise<GetUserOutput | null> => {
      // Require authentication
      await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<UserController>("userController");

      // Fetch user and handle result
      const result = await controller.getById({ id: args.id });

      // Handle errors manually to support "not found" -> null semantics
      if (result.kind === "err") {
        const error = result.error as Error;
        // Return null for not found, throw for other errors
        if (error.message?.toLowerCase().includes("not found")) {
          return null;
        }
        throw mapErrorToGraphQL(error);
      }

      return result.value;
    },
  }),
);

/**
 * Query: users - Get all users (admin only)
 *
 * Requires admin role. Returns a list of all users.
 */
builder.queryField("users", (t) =>
  t.field({
    description: "Get all users (admin only)",
    type: ["User"],
    args: {
      limit: t.arg.int({
        description: "Maximum number of users to return",
        required: false,
        defaultValue: 20,
      }),
      offset: t.arg.int({
        description: "Number of users to skip",
        required: false,
        defaultValue: 0,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context): Promise<GetUserOutput[]> => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<UserController>("userController");

      // Fetch users using error mapper for consistent handling
      return handleResult(
        await controller.list({
          limit: args.limit ?? 20,
          offset: args.offset ?? 0,
        }),
      );
    },
  }),
);

/**
 * Query: me - Get current authenticated user
 *
 * Returns the currently authenticated user's profile.
 */
builder.queryField("me", (t) =>
  t.field({
    description: "Get the currently authenticated user",
    type: "User",
    nullable: true,
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, _args, context): Promise<GetUserOutput | null> => {
      // Get current user's auth context
      const authContext = await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<UserController>("userController");

      // Fetch user by their own ID
      const result = await controller.getById({
        id: authContext.userId as string,
      });

      // Handle errors manually to support "not found" -> null semantics
      if (result.kind === "err") {
        const error = result.error as Error;
        // Return null for not found, throw for other errors
        if (error.message?.toLowerCase().includes("not found")) {
          return null;
        }
        throw mapErrorToGraphQL(error);
      }

      return result.value;
    },
  }),
);

// =============================================================================
// Mutation Fields
// =============================================================================

/**
 * Mutation: createUser - Create a new user
 *
 * Requires admin role. Creates a user with specified details.
 */
builder.mutationField("createUser", (t) =>
  t.field({
    description: "Create a new user (admin only)",
    type: UserCreateResultType,
    authScopes: { admin: true },
    args: {
      input: t.arg({
        type: CreateUserInput,
        description: "User creation input",
        required: true,
      }),
    },
    resolve: async (_root, args, context): Promise<CreateUserOutput> => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<UserController>("userController");

      // Create user
      const result = await controller.create({
        authUserId: args.input.authUserId,
        firstName: args.input.firstName,
        lastName: args.input.lastName,
        role: args.input.role ?? undefined,
      });

      // Handle errors
      if (result.success === false) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Mutation: updateUser - Update an existing user
 *
 * Requires authentication. Users can update their own profile,
 * admins can update any user.
 */
builder.mutationField("updateUser", (t) =>
  t.field({
    description: "Update a user's profile information",
    type: UserUpdateResultType,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({
        type: UpdateUserInput,
        description: "User update input",
        required: true,
      }),
    },
    resolve: async (_root, args, context): Promise<UpdateUserOutput> => {
      // Require authentication
      const authContext = await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<UserController>("userController");

      // Check authorization - users can update themselves, admins can update anyone
      const targetUserId = args.input.userId.toString();
      const isOwnProfile = authContext.userId === targetUserId;
      const isAdmin =
        authContext.role === "ADMIN" || authContext.role === "SERVICE";

      if (!isOwnProfile && !isAdmin) {
        throw mapErrorToGraphQL(
          new Error("Forbidden: Can only update your own profile"),
        );
      }

      // Update user
      const result = await controller.update({
        userId: targetUserId,
        firstName: args.input.firstName ?? undefined,
        lastName: args.input.lastName ?? undefined,
        hasAvatar: args.input.hasAvatar ?? undefined,
      });

      // Handle errors
      if (result.success === false) {
        // Return null for not found, throw for other errors
        if (result.error.toLowerCase().includes("not found")) {
          throw mapErrorToGraphQL(new Error("User not found"));
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

// =============================================================================
// Export
// =============================================================================

// Resolvers are registered automatically by importing this file
export {};
