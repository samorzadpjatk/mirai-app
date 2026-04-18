// =============================================================================
// User Types
// =============================================================================

import { builder } from "../../builder.js";
import type { UserProfileDTO, UserWithTripInfoDTO } from "@mirai-app/use-cases/user/dto";
import type { Role } from "@mirai-app/domain";
import { RoleEnum } from "../../builder.js";

// =============================================================================
// Object Types
// =============================================================================

/**
 * User type
 *
 * Core user entity with profile information.
 * Can be converted to Relay Node pattern when PothosTypes are configured.
 */
export const UserType = builder.objectType("User", {
  description: "User entity",
  fields: (t) => ({
    id: t.exposeID("id"),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    email: t.exposeString("email", { nullable: true }),
    role: t.field({
      type: RoleEnum,
      resolve: (user) => user.role as Role,
    }),
    hasAvatar: t.exposeBoolean("hasAvatar"),
    fullName: t.string({
      resolve: (user) => {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
        return fullName || user.email || "Unknown user";
      },
    }),
  }),
});

/**
 * User with trip participant info
 */
export const UserWithTripInfoType = builder.objectType("UserWithTripInfo", {
  description: "User with trip participant information",
  fields: (t) => ({
    id: t.exposeID("id"),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    email: t.exposeString("email", { nullable: true }),
    role: t.field({
      type: RoleEnum,
      resolve: (user) => user.role as Role,
    }),
    hasAvatar: t.exposeBoolean("hasAvatar"),
    wristNumber: t.exposeString("wristNumber", { nullable: true }),
    houseNumber: t.exposeString("houseNumber", { nullable: true }),
    groupId: t.exposeID("groupId", { nullable: true }),
    groupName: t.exposeString("groupName", { nullable: true }),
    tripId: t.exposeID("tripId"),
    isBanned: t.exposeBoolean("isBanned"),
    bannedUntil: t.exposeString("bannedUntil", { nullable: true }),
    banReason: t.exposeString("banReason", { nullable: true }),
  }),
});

/**
 * User profile type
 */
export const UserProfileType = builder.objectType("UserProfile", {
  description: "User profile information",
  fields: (t) => ({
    id: t.exposeID("id"),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    email: t.exposeString("email", { nullable: true }),
    role: t.field({
      type: RoleEnum,
      resolve: (user) => user.role as Role,
    }),
    hasAvatar: t.exposeBoolean("hasAvatar"),
  }),
});

/**
 * Group info for user context
 */
export const GroupInfoType = builder.objectType("GroupInfo", {
  description: "Basic group information",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
  }),
});

/**
 * Trip info for user context
 */
export const TripInfoType = builder.objectType("TripInfo", {
  description: "Basic trip information",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
  }),
});

/**
 * User with group info for a trip
 */
export const UserWithGroupInfoType = builder.objectType("UserWithGroupInfo", {
  description: "User with group information for a trip",
  fields: (t) => ({
    id: t.exposeID("id"),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    trips: t.field({
      type: [UserTripInfoType],
      resolve: (user) => user.trips || [],
    }),
    organizerGroup: t.field({
      type: GroupInfoType,
      nullable: true,
      resolve: (user) => user.organizerGroup,
    }),
  }),
});

/**
 * User trip membership info
 */
export const UserTripInfoType = builder.objectType("UserTripInfo", {
  description: "User's trip membership with group info",
  fields: (t) => ({
    tripId: t.exposeID("tripId"),
    group: t.field({
      type: GroupInfoType,
      nullable: true,
      resolve: (info) => info.group,
    }),
    trip: t.field({
      type: TripInfoType,
      nullable: true,
      resolve: (info) => info.trip,
    }),
  }),
});

/**
 * Ban status type
 */
export const BanStatusType = builder.objectType("BanStatus", {
  description: "User ban status information",
  fields: (t) => ({
    banned: t.exposeBoolean("banned"),
    bannedUntil: t.exposeString("bannedUntil", { nullable: true }),
    reason: t.exposeString("reason", { nullable: true }),
    exists: t.exposeBoolean("exists", { nullable: true }),
  }),
});

/**
 * Trip participant info
 */
export const TripParticipantInfoType = builder.objectType("TripParticipantInfo", {
  description: "Trip participant information",
  fields: (t) => ({
    userId: t.exposeID("userId"),
    tripId: t.exposeID("tripId"),
    wristNumber: t.exposeString("wristNumber", { nullable: true }),
    houseNumber: t.exposeString("houseNumber", { nullable: true }),
    group: t.field({
      type: GroupInfoType,
      nullable: true,
      resolve: (info) => info.group,
    }),
  }),
});

/**
 * User Connection type for Relay pagination
 *
 * Implements the Relay connection specification for paginated user lists.
 * Creates both UserConnection and UserEdge types automatically.
 *
 * @example
 * ```typescript
 * const result = await ctx.controllers.userController.searchUsers({ ... });
 * return buildConnection({
 *   items: result.users,
 *   hasMore: result.pagination.hasMore,
 *   getCursor: (user) => encodeCursor(user.id),
 * });
 * ```
 */
export const UserConnectionType = builder.connectionObject(
  { name: "UserConnection", type: UserWithTripInfoType },
  { name: "UserEdge" },
);

// UserEdgeType is registered as "UserEdge" and can be referenced by name in fields

/**
 * Admin user names (lightweight)
 */
export const AdminNameType = builder.objectType("AdminName", {
  description: "Admin user name information",
  fields: (t) => ({
    id: t.exposeID("id"),
    firstName: t.exposeString("firstName", { nullable: true }),
    lastName: t.exposeString("lastName", { nullable: true }),
  }),
});

// =============================================================================
// Input Types
// =============================================================================

/**
 * Update user profile input
 */
export const UpdateUserProfileInput = builder.inputType("UpdateUserProfileInput", {
  fields: (t) => ({
    firstName: t.string({ required: true }),
    lastName: t.string({ required: true }),
  }),
});

/**
 * Update avatar input
 */
export const UpdateAvatarInput = builder.inputType("UpdateAvatarInput", {
  fields: (t) => ({
    hasAvatar: t.boolean({ required: true }),
  }),
});

/**
 * Create user input
 */
export const CreateUserInput = builder.inputType("CreateUserInput", {
  fields: (t) => ({
    tripId: t.string({ required: true }),
    firstName: t.string({ required: true }),
    lastName: t.string({ required: true }),
    email: t.string({ required: true }),
  }),
});

/**
 * Update user role input
 */
export const UpdateUserRoleInput = builder.inputType("UpdateUserRoleInput", {
  fields: (t) => ({
    userId: t.string({ required: true }),
    role: t.field({ type: RoleEnum, required: true }),
  }),
});

/**
 * Update user name input
 */
export const UpdateUserNameInput = builder.inputType("UpdateUserNameInput", {
  fields: (t) => ({
    userId: t.string({ required: true }),
    firstName: t.string({ required: true }),
    lastName: t.string({ required: true }),
  }),
});

/**
 * Ban user input
 */
export const BanUserInput = builder.inputType("BanUserInput", {
  fields: (t) => ({
    userId: t.string({ required: true }),
    bannedUntilMs: t.int({ required: true }),
    reason: t.string({ required: false }),
  }),
});

/**
 * Update wrist number input
 */
export const UpdateWristNumberInput = builder.inputType("UpdateWristNumberInput", {
  fields: (t) => ({
    userId: t.string({ required: true }),
    tripId: t.string({ required: true }),
    wristNumber: t.string({ required: true }),
  }),
});

/**
 * Update house number input
 */
export const UpdateHouseNumberInput = builder.inputType("UpdateHouseNumberInput", {
  fields: (t) => ({
    userId: t.string({ required: true }),
    tripId: t.string({ required: true }),
    houseNumber: t.string({ required: true }),
  }),
});

/**
 * Delete user input
 */
export const DeleteUserInput = builder.inputType("DeleteUserInput", {
  fields: (t) => ({
    userId: t.string({ required: true }),
    tripId: t.string({ required: true }),
  }),
});

/**
 * Search users input
 */
export const SearchUsersInput = builder.inputType("SearchUsersInput", {
  fields: (t) => ({
    tripId: t.string({ required: true }),
    field: t.string({ required: true }), // firstName, lastName, email, wristNumber, houseNumber, groupName
    searchTerm: t.string({ required: false }),
  }),
});

/**
 * Get user by email input
 */
export const GetUserByEmailInput = builder.inputType("GetUserByEmailInput", {
  fields: (t) => ({
    email: t.string({ required: true }),
  }),
});

// =============================================================================
// Result Types
// =============================================================================

/**
 * Update profile result
 */
export const UpdateProfileResultType = builder.objectType("UpdateProfileResult", {
  description: "User profile update result",
  fields: (t) => ({
    id: t.exposeID("id"),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
  }),
});

/**
 * Avatar update result
 */
export const AvatarUpdateResultType = builder.objectType("AvatarUpdateResult", {
  description: "Avatar update result",
  fields: (t) => ({
    hasAvatar: t.exposeBoolean("hasAvatar"),
  }),
});

/**
 * Create user result
 */
export const CreateUserResultType = builder.objectType("CreateUserResult", {
  description: "User creation result",
  fields: (t) => ({
    id: t.exposeID("id"),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    email: t.exposeString("email"),
    role: t.field({
      type: RoleEnum,
      resolve: (result) => result.role as Role,
    }),
    wristNumber: t.exposeString("wristNumber", { nullable: true }),
    houseNumber: t.exposeString("houseNumber", { nullable: true }),
    groupId: t.exposeID("groupId", { nullable: true }),
    groupName: t.exposeString("groupName", { nullable: true }),
    tripId: t.exposeID("tripId"),
  }),
});

/**
 * Update user result
 */
export const UpdateUserResultType = builder.objectType("UpdateUserResult", {
  description: "User update result",
  fields: (t) => ({
    id: t.exposeID("id"),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    email: t.exposeString("email", { nullable: true }),
    role: t.field({
      type: RoleEnum,
      resolve: (result) => result.role as Role,
    }),
  }),
});

/**
 * Delete user result
 */
export const DeleteUserResultType = builder.objectType("DeleteUserResult", {
  description: "User deletion result",
  fields: (t) => ({
    deletedFromSystem: t.exposeBoolean("deletedFromSystem"),
  }),
});

/**
 * Ban user result
 */
export const BanUserResultType = builder.objectType("BanUserResult", {
  description: "Ban user result",
  fields: (t) => ({
    bannedUntil: t.exposeString("bannedUntil"),
  }),
});

/**
 * Participant number update result
 */
export const ParticipantNumberResultType = builder.objectType("ParticipantNumberResult", {
  description: "Participant number update result",
  fields: (t) => ({
    userId: t.exposeID("userId"),
    tripId: t.exposeID("tripId"),
    wristNumber: t.exposeString("wristNumber", { nullable: true }),
    houseNumber: t.exposeString("houseNumber", { nullable: true }),
  }),
});

// =============================================================================
// Type Exports
// =============================================================================

export type {
  UserProfileDTO,
  UserWithTripInfoDTO,
} from "@mirai-app/use-cases/user/dto";
