/**
 * Group GraphQL Resolvers
 *
 * Resolvers for Group domain queries and mutations.
 * Maps controller outputs to GraphQL responses with proper error handling.
 *
 * @module Group/resolvers
 */

import { builder } from "../builder";
import { GroupController } from "@mirai-app/adapters";
import {
  requireAuth,
  requireAdmin,
  requireModerator,
} from "../utils/auth-helpers";
import { mapErrorToGraphQL } from "../utils/error-mapper";

// =============================================================================
// Import Types (registers them with builder)
// =============================================================================

import "../types/group";

// =============================================================================
// Query Fields
// =============================================================================

/**
 * Query: groups - Get all groups (admin only)
 *
 * Requires admin role. Returns paginated list of all groups.
 */
builder.queryField("groups", (t) =>
  t.field({
    description: "Get all groups (admin only)",
    type: "GroupsConnection",
    nullable: false,
    args: {
      pagination: t.arg({
        type: "GroupPaginationInput",
        description: "Pagination parameters",
        required: false,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<GroupController>("groupController");

      // Fetch groups
      const result = await controller.list({
        limit: args.pagination?.limit ?? 30,
        offset: args.pagination?.offset ?? 0,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      const groups = result.data;
      const limit = args.pagination?.limit ?? 30;
      const offset = args.pagination?.offset ?? 0;

      return {
        groups,
        pagination: {
          total: groups.length,
          limit,
          offset,
          hasMore: offset + limit < groups.length,
        },
      };
    },
  }),
);

/**
 * Query: groupsByTrip - Get groups for a specific trip
 *
 * Requires authentication. Returns paginated groups for a trip.
 */
builder.queryField("groupsByTrip", (t) =>
  t.field({
    description: "Get groups for a specific trip",
    type: "GroupsConnection",
    nullable: false,
    args: {
      tripId: t.arg.id({
        description: "ID of the trip to fetch groups for",
        required: true,
      }),
      pagination: t.arg({
        type: "GroupPaginationInput",
        description: "Pagination parameters",
        required: false,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Require authentication
      await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<GroupController>("groupController");

      // Fetch groups by trip
      const result = await controller.getByTripId({
        tripId: args.tripId,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      const limit = args.pagination?.limit ?? 30;
      const offset = args.pagination?.offset ?? 0;
      const allGroups = result.data;

      // Apply pagination
      const paginatedGroups = allGroups.slice(offset, offset + limit);

      return {
        groups: paginatedGroups,
        pagination: {
          total: allGroups.length,
          limit,
          offset,
          hasMore: offset + limit < allGroups.length,
        },
      };
    },
  }),
);

/**
 * Query: group - Get a single group by ID
 *
 * Requires authentication. Returns a single group or null if not found.
 */
builder.queryField("group", (t) =>
  t.field({
    description: "Get a group by its ID",
    type: "Group",
    nullable: true,
    args: {
      id: t.arg.id({
        description: "Group ID",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Require authentication
      await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<GroupController>("groupController");

      // Fetch group
      const result = await controller.getById({ id: args.id });

      if (!result.success) {
        // Return null for not found
        if (result.error.toLowerCase().includes("not found")) {
          return null;
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Query: groupByCode - Get a group by its unique code
 *
 * Requires authentication. Returns a single group or null if not found.
 */
builder.queryField("groupByCode", (t) =>
  t.field({
    description: "Get a group by its unique code",
    type: "Group",
    nullable: true,
    args: {
      code: t.arg.string({
        description: "Group code",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Require authentication
      await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<GroupController>("groupController");

      // Fetch group by code
      const result = await controller.getByCode({ code: args.code });

      if (!result.success) {
        // Return null for not found
        if (result.error.toLowerCase().includes("not found")) {
          return null;
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Query: groupsByOrganizer - Get groups by organizer ID
 *
 * Requires authentication. Returns groups organized by a specific user.
 */
builder.queryField("groupsByOrganizer", (t) =>
  t.field({
    description: "Get groups organized by a specific user",
    type: ["Group"],
    nullable: false,
    args: {
      organizerId: t.arg.id({
        description: "ID of the organizer",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Require authentication
      await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<GroupController>("groupController");

      // Fetch groups by organizer
      const result = await controller.getByOrganizer({
        organizerId: args.organizerId,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Query: groupNamesByTrip - Get group names for a trip (moderator only)
 *
 * Returns simplified list of {id, name} for selection UIs.
 */
builder.queryField("groupNamesByTrip", (t) =>
  t.field({
    description: "Get group names for a trip (moderator only)",
    type: ["GroupSummary"],
    nullable: false,
    args: {
      tripId: t.arg.id({
        description: "ID of the trip",
        required: true,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (_root, args, context) => {
      // Require moderator
      await requireModerator(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<GroupController>("groupController");

      // Fetch groups by trip and map to summary
      const result = await controller.getByTripId({
        tripId: args.tripId,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data.map((group) => ({
        id: group.id,
        name: group.name,
      }));
    },
  }),
);

/**
 * Query: groupRanking - Get group rankings for a trip
 *
 * Requires authentication. Returns groups sorted by coins.
 */
builder.queryField("groupRanking", (t) =>
  t.field({
    description: "Get group rankings for a trip",
    type: "GroupRankingResult",
    nullable: false,
    args: {
      tripId: t.arg.id({
        description: "ID of the trip",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Require authentication
      await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<GroupController>("groupController");

      // Fetch groups by trip
      const result = await controller.getByTripId({
        tripId: args.tripId,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      // Sort by coins descending
      const sortedGroups = [...result.data].sort((a, b) => b.coins - a.coins);

      return {
        data: sortedGroups,
        currentDate: new Date(),
      };
    },
  }),
);

// =============================================================================
// Mutation Fields
// =============================================================================

/**
 * Mutation: createGroup - Create a new group
 *
 * Requires authentication. Creates a new group with the provided data.
 */
builder.mutationField("createGroup", (t) =>
  t.field({
    description: "Create a new group",
    type: "CreateGroupPayload",
    nullable: false,
    args: {
      input: t.arg({
        type: "CreateGroupInput",
        description: "Group creation data",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Require authentication
      const authContext = await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<GroupController>("groupController");

      // Generate a unique code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create group
      const result = await controller.create({
        tripId: args.input.tripId,
        name: args.input.name,
        description: args.input.description ?? null,
        image: args.input.image ?? null,
        organizerId: args.input.organizerId ?? authContext.userId,
        code,
        coins: 0,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { group: result.data };
    },
  }),
);

/**
 * Mutation: updateGroup - Update an existing group
 *
 * Requires authentication. Updates group details.
 */
builder.mutationField("updateGroup", (t) =>
  t.field({
    description: "Update an existing group",
    type: "UpdateGroupPayload",
    nullable: false,
    args: {
      input: t.arg({
        type: "UpdateGroupInput",
        description: "Group update data",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Require authentication
      await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<GroupController>("groupController");

      // Update group
      const result = await controller.update({
        groupId: args.input.id,
        name: args.input.name ?? undefined,
        description: args.input.description,
        image: args.input.image,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { group: result.data };
    },
  }),
);

/**
 * Mutation: deleteGroup - Delete (soft delete) a group
 *
 * Requires admin role. Soft-deletes a group by marking it as deleted.
 */
builder.mutationField("deleteGroup", (t) =>
  t.field({
    description: "Delete a group (admin only)",
    type: "DeleteGroupPayload",
    nullable: false,
    args: {
      id: t.arg.id({
        description: "ID of the group to delete",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<GroupController>("groupController");

      // Delete group
      const result = await controller.delete({ id: args.id });

      if (!result.success) {
        // Special handling for not found
        if (result.error.toLowerCase().includes("not found")) {
          throw mapErrorToGraphQL(
            Object.assign(new Error(result.error), { name: "NotFoundError" }),
          );
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { success: true };
    },
  }),
);

/**
 * Mutation: addCoins - Add coins to a group
 *
 * Requires moderator role. Adds coins to a group's balance.
 */
builder.mutationField("addCoins", (t) =>
  t.field({
    description: "Add coins to a group (moderator only)",
    type: "AddCoinsPayload",
    nullable: false,
    args: {
      input: t.arg({
        type: "AddCoinsInput",
        description: "Add coins data",
        required: true,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (_root, args, context) => {
      // Require moderator
      await requireModerator(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<GroupController>("groupController");

      // Add coins
      const result = await controller.addCoins({
        groupId: args.input.groupId,
        amount: args.input.amount,
      });

      if (!result.success) {
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
