/**
 * User GraphQL Type
 *
 * Pothos type definition for the User domain entity.
 * Maps from GetUserOutput DTO to GraphQL schema type.
 *
 * ## Fields
 *
 * - id: Unique user ID (UUID)
 * - authUserId: External authentication provider ID
 * - firstName: User's first name
 * - lastName: User's last name
 * - fullName: Computed full name
 * - role: User role (USER, MODERATOR, ADMIN, SERVICE)
 * - hasAvatar: Whether user has uploaded an avatar
 * - createdAt: Account creation timestamp
 * - lastSeenOn: Last activity timestamp (nullable)
 *
 * @module User
 */

import { builder, UserRoleEnum } from "../builder";

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
// Export
// =============================================================================

export default UserType;
