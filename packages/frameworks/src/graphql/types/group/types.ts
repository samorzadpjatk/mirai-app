// =============================================================================
// Group Types
// =============================================================================

import { builder } from "../../builder.js";
import type { GroupWithStatsDTO } from "@mirai-app/use-cases/group/dto";

// =============================================================================
// Object Types
// =============================================================================

/**
 * Group type
 */
export const GroupType = builder.objectType("Group", {
  description: "Group entity",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    code: t.exposeString("code"),
    image: t.exposeString("image", { nullable: true }),
    coins: t.exposeInt("coins"),
    tripId: t.exposeID("tripId"),
    isDeleted: t.exposeBoolean("isDeleted"),
    createdAt: t.field({ type: "DateTime", resolve: (g) => g.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: (g) => g.updatedAt }),
  }),
});

/**
 * Group with statistics
 */
export const GroupWithStatsType = builder.objectType("GroupWithStats", {
  description: "Group with participant statistics",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    code: t.exposeString("code"),
    image: t.exposeString("image", { nullable: true }),
    coins: t.exposeInt("coins"),
    participantCount: t.exposeInt("participantCount"),
  }),
});



/**
 * Group participant
 */
export const GroupParticipantType = builder.objectType("GroupParticipant", {
  description: "Group participant",
  fields: (t) => ({
    id: t.exposeID("id"),
    user: t.field({
      type: GroupMemberType,
      resolve: (p) => p.user,
    }),
    joinedAt: t.field({
      type: "DateTime",
      resolve: (p) => p.joinedAt,
    }),
  }),
});

/**
 * Group member (for organizer and participant user details)
 */
export const GroupMemberType = builder.objectType("GroupMember", {
  description: "Group member user details",
  fields: (t) => ({
    id: t.exposeID("id"),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    email: t.exposeString("email", { nullable: true }),
  }),
});

/**
 * Coin transaction in group
 */
export const GroupCoinTransactionType = builder.objectType("GroupCoinTransaction", {
  description: "Coin transaction in group context",
  fields: (t) => ({
    id: t.exposeID("id"),
    groupId: t.exposeID("groupId"),
    amount: t.exposeInt("amount"),
    reason: t.exposeString("reason", { nullable: true }),
    adminId: t.exposeID("adminId"),
    createdAt: t.field({
      type: "DateTime",
      resolve: (tx) => tx.createdAt,
    }),
  }),
});

/**
 * Group with full details
 */
export const GroupWithDetailsType = builder.objectType("GroupWithDetails", {
  description: "Group with participants and transactions",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    code: t.exposeString("code"),
    image: t.exposeString("image", { nullable: true }),
    coins: t.exposeInt("coins"),
    tripId: t.exposeID("tripId"),
    isDeleted: t.exposeBoolean("isDeleted"),
    organizer: t.field({
      type: GroupMemberType,
      nullable: true,
      resolve: (group) => group.organizer,
    }),
    participants: t.field({
      type: [GroupParticipantType],
      resolve: (group) => group.participants || [],
    }),
    coinTransactions: t.field({
      type: [GroupCoinTransactionType],
      resolve: (group) => group.coinTransactions || [],
    }),
    participantCount: t.field({
      type: "Int",
      resolve: (group) => group.participants?.length ?? 0,
    }),
    createdAt: t.field({ type: "DateTime", resolve: (g) => g.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: (g) => g.updatedAt }),
  }),
});

/**
 * Relay Connection for Group pagination
 *
 * Implements the Relay Cursor Connections Specification for forward pagination.
 */
export const GroupConnectionType = builder.connectionObject(
  { name: "GroupConnection", type: GroupWithDetailsType },
  { name: "GroupEdge" }
);

/**
 * Group ranking entry
 */
export const GroupRankingEntryType = builder.objectType("GroupRankingEntry", {
  description: "Group ranking entry",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    image: t.exposeString("image", { nullable: true }),
    coins: t.exposeInt("coins"),
    rank: t.exposeInt("rank"),
    participantCount: t.field({
      type: "Int",
      resolve: (group) => group.participants?.length ?? 0,
    }),
  }),
});

/**
 * Group ranking result
 */
export const GroupRankingResultType = builder.objectType("GroupRankingResult", {
  description: "Group ranking for a trip",
  fields: (t) => ({
    groups: t.field({
      type: [GroupRankingEntryType],
      resolve: (result) => result.groups,
    }),
    currentDate: t.field({
      type: "DateTime",
      resolve: (result) => result.currentDate,
    }),
  }),
});

/**
 * Join request type
 */
export const GroupJoinRequestType = builder.objectType("GroupJoinRequest", {
  description: "Group join request",
  fields: (t) => ({
    id: t.exposeID("id"),
    groupId: t.exposeID("groupId"),
    tripId: t.exposeID("tripId"),
    userId: t.exposeID("userId"),
    user: t.field({
      type: GroupMemberType,
      resolve: (req) => req.user,
    }),
    status: t.field({
      type: "String",
      resolve: (req) => req.status,
    }),
    requestedAt: t.field({
      type: "DateTime",
      resolve: (req) => req.requestedAt,
    }),
  }),
});

/**
 * Approved submission for gallery
 */
export const GroupGallerySubmissionType = builder.objectType("GroupGallerySubmission", {
  description: "Approved challenge submission for group gallery",
  fields: (t) => ({
    submissionId: t.exposeID("submissionId"),
    challengeId: t.exposeID("challengeId"),
    challengeTitle: t.exposeString("challengeTitle"),
    imageStoragePath: t.exposeString("imageStoragePath"),
    approvedAt: t.field({
      type: "DateTime",
      resolve: (sub) => sub.approvedAt,
    }),
  }),
});

// =============================================================================
// Input Types
// =============================================================================

/**
 * Create group input
 */
export const CreateGroupInput = builder.inputType("CreateGroupInput", {
  fields: (t) => ({
    tripId: t.string({ required: true }),
    name: t.string({ required: true }),
    description: t.string({ required: false }),
    image: t.string({ required: false }),
    organizerId: t.string({ required: false }),
  }),
});

/**
 * Update group input
 */
export const UpdateGroupInput = builder.inputType("UpdateGroupInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
    tripId: t.string({ required: true }),
    name: t.string({ required: false }),
    description: t.string({ required: false }),
    image: t.string({ required: false }),
    organizerId: t.string({ required: false }),
  }),
});

/**
 * Delete group input
 */
export const DeleteGroupInput = builder.inputType("DeleteGroupInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
  }),
});

/**
 * Join group input
 */
export const JoinGroupInput = builder.inputType("JoinGroupInput", {
  fields: (t) => ({
    groupId: t.string({ required: true }),
    tripId: t.string({ required: true }),
  }),
});

/**
 * Request to join group input
 */
export const RequestJoinGroupInput = builder.inputType("RequestJoinGroupInput", {
  fields: (t) => ({
    groupId: t.string({ required: true }),
  }),
});

/**
 * Respond to join request input
 */
export const RespondJoinRequestInput = builder.inputType("RespondJoinRequestInput", {
  fields: (t) => ({
    requestId: t.string({ required: true }),
    accept: t.boolean({ required: true }),
  }),
});

/**
 * Add coins to group input
 */
export const AddGroupCoinsInput = builder.inputType("AddGroupCoinsInput", {
  fields: (t) => ({
    groupId: t.string({ required: true }),
    tripId: t.string({ required: true }),
    amount: t.int({ required: true }),
  }),
});

/**
 * Bulk assign users to group input
 */
export const BulkAssignUsersInput = builder.inputType("BulkAssignUsersInput", {
  fields: (t) => ({
    tripId: t.string({ required: true }),
    groupId: t.string({ required: true }),
    userIds: t.stringList({ required: true }),
  }),
});

// =============================================================================
// Result Types
// =============================================================================

/**
 * Create group result
 */
export const CreateGroupResultType = builder.objectType("CreateGroupResult", {
  description: "Group creation result",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    code: t.exposeString("code"),
    image: t.exposeString("image", { nullable: true }),
    coins: t.exposeInt("coins"),
    organizer: t.field({
      type: GroupMemberType,
      nullable: true,
      resolve: (result) => result.organizer,
    }),
  }),
});

/**
 * Update group result
 */
export const UpdateGroupResultType = builder.objectType("UpdateGroupResult", {
  description: "Group update result",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    image: t.exposeString("image", { nullable: true }),
    organizerId: t.exposeID("organizerId", { nullable: true }),
  }),
});

/**
 * Join group result
 */
export const JoinGroupResultType = builder.objectType("JoinGroupResult", {
  description: "Join group result",
  fields: (t) => ({
    success: t.exposeBoolean("success"),
    groupId: t.exposeID("groupId"),
  }),
});

/**
 * Leave group result
 */
export const LeaveGroupResultType = builder.objectType("LeaveGroupResult", {
  description: "Leave group result",
  fields: (t) => ({
    left: t.exposeBoolean("left"),
    reassignedOrganizerId: t.exposeID("reassignedOrganizerId", { nullable: true }),
    groupDeleted: t.exposeBoolean("groupDeleted"),
  }),
});

/**
 * Join request response result
 */
export const JoinRequestResponseType = builder.objectType("JoinRequestResponse", {
  description: "Join request response result",
  fields: (t) => ({
    status: t.exposeString("status"),
  }),
});

/**
 * Add coins result
 */
export const AddCoinsResultType = builder.objectType("AddCoinsResult", {
  description: "Add coins to group result",
  fields: (t) => ({
    groupId: t.exposeID("groupId"),
    previousCoins: t.exposeInt("previousCoins"),
    newCoins: t.exposeInt("newCoins"),
    amount: t.exposeInt("amount"),
  }),
});

/**
 * Bulk assign result
 */
export const BulkAssignResultType = builder.objectType("BulkAssignResult", {
  description: "Bulk assign users result",
  fields: (t) => ({
    count: t.exposeInt("count"),
    participants: t.field({
      type: [GroupParticipantType],
      resolve: (result) => result.participants || [],
    }),
  }),
});
