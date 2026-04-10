import { builder } from "../builder";
import type { User } from "@mirai-app/domain";

/**
 * User Type (Pothos)
 *
 * GraphQL type definition for User entity.
 * Maps domain User entity to GraphQL schema.
 *
 * Phase 3: API Layer
 * - Code-first type definition
 * - Integrates with domain layer via DI container
 * - Field-level resolvers call use cases
 */
export const UserType = builder.objectType<"User">("User", {
  description: "A user of the application",
  fields: (t) => ({
    id: t.exposeID("id", { description: "Unique user identifier" }),

    authUserId: t.exposeString("authUserId", {
      description: "External authentication provider user ID",
      authScopes: { authenticated: true }, // Only authenticated users can see this
    }),

    firstName: t.exposeString("firstName", {
      description: "User's first name",
    }),

    lastName: t.exposeString("lastName", {
      description: "User's last name",
    }),

    fullName: t.string({
      description: "Computed full name",
      resolve: (user) => `${user.firstName} ${user.lastName}`,
    }),

    role: t.exposeString("role", {
      description: "User role (USER, MODERATOR, ADMIN, SERVICE)",
    }),

    hasAvatar: t.exposeBoolean("hasAvatar", {
      description: "Whether the user has uploaded an avatar",
    }),

    createdAt: t.field({
      type: "DateTime",
      description: "When the user account was created",
      resolve: (user) => user.createdAt,
    }),

    updatedAt: t.field({
      type: "DateTime",
      description: "When the user account was last updated",
      resolve: (user) => user.updatedAt,
    }),

    lastSeenOn: t.field({
      type: "DateTime",
      nullable: true,
      description: "When the user was last active",
      resolve: (user) => user.lastSeenOn,
    }),
  }),
});

/**
 * User Input Types
 */
export const CreateUserInput = builder.inputType("CreateUserInput", {
  description: "Input for creating a new user",
  fields: (t) => ({
    authUserId: t.string({ required: true }),
    firstName: t.string({
      required: true,
      validate: { minLength: 2, maxLength: 100 },
    }),
    lastName: t.string({
      required: true,
      validate: { minLength: 2, maxLength: 100 },
    }),
    role: t.string({ required: false, defaultValue: "USER" }),
  }),
});

export const UpdateUserInput = builder.inputType("UpdateUserInput", {
  description: "Input for updating a user",
  fields: (t) => ({
    firstName: t.string({
      required: false,
      validate: { minLength: 2, maxLength: 100 },
    }),
    lastName: t.string({
      required: false,
      validate: { minLength: 2, maxLength: 100 },
    }),
    hasAvatar: t.boolean({ required: false }),
  }),
});

/**
 * User Result Types
 *
 * Used for mutations that return either a User or an error
 */
export const UserResult = builder.unionType("UserResult", {
  description: "Result of a user mutation",
  types: [UserType, "Error"],
  resolveType: (value) => {
    if ("id" in value) return "User";
    return "Error";
  },
});

export const ErrorType = builder.objectType<"Error">("Error", {
  description: "Error result",
  fields: (t) => ({
    message: t.exposeString("message"),
    code: t.exposeString("code", { nullable: true }),
  }),
});
