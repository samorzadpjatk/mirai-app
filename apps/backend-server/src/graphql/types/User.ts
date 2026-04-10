/**
 * User GraphQL Type
 *
 * Pothos type definition for the User domain entity.
 * Maps from use case DTOs to GraphQL schema types.
 *
 * ## Types
 *
 * - User: Main user type (from GetUserOutput)
 * - UserCreateResult: Result from createUser mutation
 * - UserUpdateResult: Result from updateUser mutation
 *
 * ## Input Types
 *
 * - CreateUserInput: Input for creating a new user
 * - UpdateUserInput: Input for updating a user
 *
 * @module User
 */

import { builder, UserRoleEnum } from "../builder";
import type { CreateUserOutput, UpdateUserOutput } from "@mirai-app/use-cases";

// =============================================================================
// User Object Type
// =============================================================================

/**
 * User type for GraphQL schema
 *
 * Derived from GetUserOutput DTO to maintain type safety
 * between domain layer and API layer.
 */
export const UserType = builder.objectType("User", {
  description: "A user in the Mirai App system",
  authScopes: {
    public: true, // User profile is publicly viewable
  },
  fields: (t) => ({
    // -------------------------------------------------------------------------
    // Identity Fields
    // -------------------------------------------------------------------------

    id: t.exposeID("id", {
      description: "Unique identifier for the user (UUID)",
      nullable: false,
    }),

    authUserId: t.exposeString("authUserId", {
      description: "External authentication provider user ID",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Name Fields
    // -------------------------------------------------------------------------

    firstName: t.exposeString("firstName", {
      description: "User's first name",
      nullable: false,
    }),

    lastName: t.exposeString("lastName", {
      description: "User's last name",
      nullable: false,
    }),

    fullName: t.exposeString("fullName", {
      description: "Computed full name (firstName + lastName)",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Role & Permissions
    // -------------------------------------------------------------------------

    role: t.field({
      type: UserRoleEnum,
      description: "User's role in the system",
      nullable: false,
      resolve: (user) => user.role as import("@mirai-app/domain").UserRole,
    }),

    // -------------------------------------------------------------------------
    // Profile Fields
    // -------------------------------------------------------------------------

    hasAvatar: t.exposeBoolean("hasAvatar", {
      description: "Whether the user has uploaded an avatar image",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Timestamp Fields
    // -------------------------------------------------------------------------

    createdAt: t.field({
      type: "DateTime",
      description: "When the user account was created",
      nullable: false,
      resolve: (user) => user.createdAt,
    }),

    lastSeenOn: t.field({
      type: "DateTime",
      description: "When the user was last active (null if never seen)",
      nullable: true,
      resolve: (user) => user.lastSeenOn,
    }),

    // -------------------------------------------------------------------------
    // Computed Fields
    // -------------------------------------------------------------------------

    isAdmin: t.boolean({
      description: "Whether the user has admin privileges",
      nullable: false,
      resolve: (user) => user.role === "ADMIN" || user.role === "SERVICE",
    }),

    isModerator: t.boolean({
      description: "Whether the user has moderator privileges or higher",
      nullable: false,
      resolve: (user) =>
        user.role === "MODERATOR" ||
        user.role === "ADMIN" ||
        user.role === "SERVICE",
    }),
  }),
});

// =============================================================================
// Result Types for Mutations
// =============================================================================

/**
 * UserCreateResult type for createUser mutation response
 *
 * Contains the created user data without lastSeenOn (not available on creation).
 */
export const UserCreateResultType = builder.objectType("UserCreateResult", {
  description: "Result of creating a new user",
  authScopes: { public: true },
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "Unique identifier for the user (UUID)",
      nullable: false,
    }),
    authUserId: t.exposeString("authUserId", {
      description: "External authentication provider user ID",
      nullable: false,
    }),
    firstName: t.exposeString("firstName", {
      description: "User's first name",
      nullable: false,
    }),
    lastName: t.exposeString("lastName", {
      description: "User's last name",
      nullable: false,
    }),
    fullName: t.exposeString("fullName", {
      description: "Computed full name (firstName + lastName)",
      nullable: false,
    }),
    role: t.field({
      type: UserRoleEnum,
      description: "User's role in the system",
      nullable: false,
      resolve: (user) => user.role as import("@mirai-app/domain").UserRole,
    }),
    hasAvatar: t.exposeBoolean("hasAvatar", {
      description: "Whether the user has uploaded an avatar image",
      nullable: false,
    }),
    createdAt: t.field({
      type: "DateTime",
      description: "When the user account was created",
      nullable: false,
      resolve: (user) => user.createdAt,
    }),
  }),
});

/**
 * UserUpdateResult type for updateUser mutation response
 *
 * Contains the updated user data with updatedAt timestamp.
 */
export const UserUpdateResultType = builder.objectType("UserUpdateResult", {
  description: "Result of updating a user",
  authScopes: { public: true },
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "Unique identifier for the user (UUID)",
      nullable: false,
    }),
    authUserId: t.exposeString("authUserId", {
      description: "External authentication provider user ID",
      nullable: false,
    }),
    firstName: t.exposeString("firstName", {
      description: "User's first name",
      nullable: false,
    }),
    lastName: t.exposeString("lastName", {
      description: "User's last name",
      nullable: false,
    }),
    fullName: t.exposeString("fullName", {
      description: "Computed full name (firstName + lastName)",
      nullable: false,
    }),
    role: t.field({
      type: UserRoleEnum,
      description: "User's role in the system",
      nullable: false,
      resolve: (user) => user.role as import("@mirai-app/domain").UserRole,
    }),
    hasAvatar: t.exposeBoolean("hasAvatar", {
      description: "Whether the user has uploaded an avatar image",
      nullable: false,
    }),
    updatedAt: t.field({
      type: "DateTime",
      description: "When the user was last updated",
      nullable: false,
      resolve: (user) => (user as UpdateUserOutput).updatedAt,
    }),
  }),
});

// =============================================================================
// Input Types for Mutations
// =============================================================================

/**
 * Input type for creating a new user
 */
export const CreateUserInput = builder.inputType("CreateUserInput", {
  description: "Input for creating a new user",
  fields: (t) => ({
    authUserId: t.string({
      description: "External authentication provider user ID (required)",
      required: true,
    }),
    firstName: t.string({
      description: "User's first name (2-100 characters, no digits)",
      required: true,
    }),
    lastName: t.string({
      description: "User's last name (2-100 characters, no digits)",
      required: true,
    }),
    role: t.field({
      type: UserRoleEnum,
      description: "User's role (defaults to USER)",
      required: false,
    }),
  }),
});

/**
 * Input type for updating a user
 */
export const UpdateUserInput = builder.inputType("UpdateUserInput", {
  description: "Input for updating an existing user",
  fields: (t) => ({
    userId: t.id({
      description: "ID of the user to update",
      required: true,
    }),
    firstName: t.string({
      description: "User's first name (2-100 characters, no digits)",
      required: false,
    }),
    lastName: t.string({
      description: "User's last name (2-100 characters, no digits)",
      required: false,
    }),
    hasAvatar: t.boolean({
      description: "Whether the user has an avatar",
      required: false,
    }),
  }),
});

// =============================================================================
// Export
// =============================================================================

export default UserType;
