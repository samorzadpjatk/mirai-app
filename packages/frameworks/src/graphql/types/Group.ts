/**
 * Group GraphQL Types
 *
 * Pothos type definitions for the Group domain entity.
 * Maps from Group controller outputs to GraphQL schema types.
 *
 * @module Group/types
 */

import { builder } from "../builder";
import type { GroupStatus } from "@mirai-app/domain";

// =============================================================================
// Enums
// =============================================================================

/**
 * Group status enum for GraphQL
 */
export const GroupStatusEnum = builder.enumType("GroupStatus", {
  description: "Current status of a group in the system",
  values: {
    ACTIVE: { value: "ACTIVE" as GroupStatus },
    DELETED: { value: "DELETED" as GroupStatus },
  },
});

// =============================================================================
// Object Types
// =============================================================================

/**
 * Group type for GraphQL schema
 *
 * Represents a participant group in a trip.
 */
export const GroupType = builder.objectType("Group", {
  description: "A participant group in a trip",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    // -------------------------------------------------------------------------
    // Identity Fields
    // -------------------------------------------------------------------------

    id: t.exposeID("id", {
      description: "Unique identifier for the group (UUID)",
      nullable: false,
    }),

    tripId: t.exposeID("tripId", {
      description: "ID of the trip this group belongs to",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Profile Fields
    // -------------------------------------------------------------------------

    name: t.exposeString("name", {
      description: "Group name",
      nullable: false,
    }),

    description: t.exposeString("description", {
      description: "Group description",
      nullable: true,
    }),

    image: t.exposeString("image", {
      description: "Group image URL",
      nullable: true,
    }),

    // -------------------------------------------------------------------------
    // Membership Fields
    // -------------------------------------------------------------------------

    organizerId: t.exposeID("organizerId", {
      description: "ID of the user who organized the group",
      nullable: false,
    }),

    code: t.exposeString("code", {
      description: "Unique code for joining the group",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Game Fields
    // -------------------------------------------------------------------------

    coins: t.exposeInt("coins", {
      description: "Number of coins the group has earned",
      nullable: false,
    }),

    status: t.field({
      type: GroupStatusEnum,
      description: "Current status of the group",
      nullable: false,
      resolve: (group) => group.status as GroupStatus,
    }),

    // -------------------------------------------------------------------------
    // Timestamp Fields
    // -------------------------------------------------------------------------

    createdAt: t.field({
      type: "DateTime",
      description: "When the group was created",
      nullable: false,
      resolve: (group) => group.createdAt,
    }),

    updatedAt: t.field({
      type: "DateTime",
      description: "When the group was last updated",
      nullable: false,
      resolve: (group) => group.updatedAt,
    }),

    // -------------------------------------------------------------------------
    // Computed Fields
    // -------------------------------------------------------------------------

    isActive: t.exposeBoolean("isActive", {
      description: "Whether the group is currently active (not deleted)",
      nullable: false,
    }),
  }),
});

/**
 * Simplified group type for list views
 */
export const GroupSummaryType = builder.objectType("GroupSummary", {
  description: "A simplified view of a group for list displays",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "Unique identifier for the group",
      nullable: false,
    }),

    name: t.exposeString("name", {
      description: "Group name",
      nullable: false,
    }),
  }),
});

/**
 * Group in ranking view
 */
export const GroupRankingType = builder.objectType("GroupRanking", {
  description: "Group information for ranking displays",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "Unique identifier for the group",
      nullable: false,
    }),

    tripId: t.exposeID("tripId", {
      description: "ID of the trip this group belongs to",
      nullable: false,
    }),

    name: t.exposeString("name", {
      description: "Group name",
      nullable: false,
    }),

    description: t.exposeString("description", {
      description: "Group description",
      nullable: true,
    }),

    image: t.exposeString("image", {
      description: "Group image URL",
      nullable: true,
    }),

    organizerId: t.exposeID("organizerId", {
      description: "ID of the group organizer",
      nullable: false,
    }),

    code: t.exposeString("code", {
      description: "Unique group code",
      nullable: false,
    }),

    coins: t.exposeInt("coins", {
      description: "Number of coins earned",
      nullable: false,
    }),

    status: t.field({
      type: GroupStatusEnum,
      description: "Current status of the group",
      nullable: false,
      resolve: (group) => (group as { status: string }).status as GroupStatus,
    }),

    createdAt: t.field({
      type: "DateTime",
      description: "When the group was created",
      nullable: false,
      resolve: (group) => (group as { createdAt: Date }).createdAt,
    }),

    isActive: t.exposeBoolean("isActive", {
      description: "Whether the group is active",
      nullable: false,
    }),
  }),
});

// =============================================================================
// Pagination Types
// =============================================================================

/**
 * Pagination info for group lists
 */
export const GroupPaginationType = builder.objectType("GroupPagination", {
  description: "Pagination metadata for group lists",
  fields: (t) => ({
    total: t.exposeInt("total", {
      description: "Total number of groups available",
      nullable: false,
    }),
    limit: t.exposeInt("limit", {
      description: "Number of items per page",
      nullable: false,
    }),
    offset: t.exposeInt("offset", {
      description: "Number of items skipped",
      nullable: false,
    }),
    hasMore: t.exposeBoolean("hasMore", {
      description: "Whether more items are available",
      nullable: false,
    }),
  }),
});

/**
 * Paginated group list result
 */
export const GroupsConnectionType = builder.objectType("GroupsConnection", {
  description: "A paginated list of groups with metadata",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    groups: t.field({
      type: [GroupType],
      description: "The groups in this page",
      nullable: false,
      resolve: (conn) => (conn as { groups: unknown[] }).groups,
    }),
    pagination: t.field({
      type: GroupPaginationType,
      description: "Pagination metadata",
      nullable: false,
      resolve: (conn) => (conn as { pagination: unknown }).pagination,
    }),
  }),
});

/**
 * Group ranking result
 */
export const GroupRankingResultType = builder.objectType("GroupRankingResult", {
  description: "Result of fetching group rankings for a trip",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    data: t.field({
      type: [GroupRankingType],
      description: "Groups sorted by coins (descending)",
      nullable: false,
      resolve: (result) => (result as { data: unknown[] }).data,
    }),
    currentDate: t.field({
      type: "DateTime",
      description: "Current date for the ranking",
      nullable: false,
      resolve: (result) => (result as { currentDate: Date }).currentDate,
    }),
  }),
});

// =============================================================================
// Mutation Payload Types
// =============================================================================

/**
 * Output type for create group mutation
 */
export const CreateGroupPayloadType = builder.objectType("CreateGroupPayload", {
  description: "Result of creating a new group",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    group: t.field({
      type: GroupType,
      description: "The newly created group",
      nullable: false,
      resolve: (payload) => (payload as { group: unknown }).group,
    }),
  }),
});

/**
 * Output type for update group mutation
 */
export const UpdateGroupPayloadType = builder.objectType("UpdateGroupPayload", {
  description: "Result of updating a group",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    group: t.field({
      type: GroupType,
      description: "The updated group",
      nullable: false,
      resolve: (payload) => (payload as { group: unknown }).group,
    }),
  }),
});

/**
 * Output type for delete group mutation
 */
export const DeleteGroupPayloadType = builder.objectType("DeleteGroupPayload", {
  description: "Result of deleting a group",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    success: t.exposeBoolean("success", {
      description: "Whether the deletion was successful",
      nullable: false,
    }),
  }),
});

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for pagination
 */
export const GroupPaginationInput = builder.inputType("GroupPaginationInput", {
  description: "Pagination parameters for group queries",
  fields: (t) => ({
    limit: t.int({
      description: "Maximum number of items to return (1-100)",
      required: false,
      defaultValue: 30,
    }),
    offset: t.int({
      description: "Number of items to skip",
      required: false,
      defaultValue: 0,
    }),
  }),
});

/**
 * Input for creating a group
 */
export const CreateGroupInput = builder.inputType("CreateGroupInput", {
  description: "Input for creating a new group",
  fields: (t) => ({
    tripId: t.id({
      description: "ID of the trip this group belongs to",
      required: true,
    }),
    name: t.string({
      description: "Group name (1-100 characters)",
      required: true,
    }),
    description: t.string({
      description: "Group description (max 500 characters)",
      required: false,
    }),
    image: t.string({
      description: "Group image URL",
      required: false,
    }),
    organizerId: t.id({
      description: "ID of the group organizer (defaults to current user)",
      required: false,
    }),
  }),
});

/**
 * Input for updating a group
 */
export const UpdateGroupInput = builder.inputType("UpdateGroupInput", {
  description: "Input for updating an existing group",
  fields: (t) => ({
    id: t.id({
      description: "ID of the group to update",
      required: true,
    }),
    tripId: t.id({
      description: "ID of the trip (for validation)",
      required: true,
    }),
    name: t.string({
      description: "New group name (1-100 characters)",
      required: false,
    }),
    description: t.string({
      description: "New description (null to clear, max 500 characters)",
      required: false,
    }),
    image: t.string({
      description: "New image URL (null to clear)",
      required: false,
    }),
  }),
});

/**
 * Input for assigning a user to a group
 */
export const AssignUserToGroupInput = builder.inputType(
  "AssignUserToGroupInput",
  {
    description: "Input for assigning a user to a group",
    fields: (t) => ({
      groupId: t.id({
        description: "ID of the group to assign the user to",
        required: true,
      }),
      userId: t.id({
        description: "ID of the user to assign to the group",
        required: true,
      }),
    }),
  },
);

/**
 * Input for removing a user from a group
 */
export const RemoveUserFromGroupInput = builder.inputType(
  "RemoveUserFromGroupInput",
  {
    description: "Input for removing a user from a group",
    fields: (t) => ({
      groupId: t.id({
        description: "ID of the group to remove the user from",
        required: true,
      }),
      userId: t.id({
        description: "ID of the user to remove from the group",
        required: true,
      }),
    }),
  },
);

// =============================================================================
// Group Member Mutation Payload Types
// =============================================================================

/**
 * Output type for assign user to group mutation
 */
export const AssignUserToGroupPayloadType = builder.objectType(
  "AssignUserToGroupPayload",
  {
    description: "Result of assigning a user to a group",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      group: t.field({
        type: GroupType,
        description: "The updated group with the newly assigned member",
        nullable: false,
        resolve: (payload) => (payload as { group: unknown }).group,
      }),
    }),
  },
);

/**
 * Output type for remove user from group mutation
 */
export const RemoveUserFromGroupPayloadType = builder.objectType(
  "RemoveUserFromGroupPayload",
  {
    description: "Result of removing a user from a group",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      group: t.field({
        type: GroupType,
        description: "The updated group without the removed member",
        nullable: false,
        resolve: (payload) => (payload as { group: unknown }).group,
      }),
    }),
  },
);

// =============================================================================
// Export
// =============================================================================

export { GroupType as default };
