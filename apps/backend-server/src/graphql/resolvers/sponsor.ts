/**
 * Sponsor GraphQL Resolvers
 *
 * Resolvers for Sponsor queries and mutations.
 * Maps controller outputs to GraphQL responses with proper error handling.
 *
 * @module sponsor/resolvers
 */

import { builder } from "../builder";
import type { SponsorController } from "@mirai-app/adapters";
import { requireAdmin } from "../utils/auth-helpers";
import { mapErrorToGraphQL } from "../utils/error-mapper";

// =============================================================================
// Import Types (registers them with builder)
// =============================================================================

import "../types/sponsor";

// =============================================================================
// Query Fields
// =============================================================================

/**
 * Query: sponsors - Get all active sponsors
 *
 * Returns a list of active sponsors (public access).
 */
builder.queryField("sponsors", (t) =>
  t.field({
    description: "Get all active sponsors",
    type: "SponsorListResult",
    authScopes: {
      public: true,
    },
    resolve: async (_root, _args, context) => {
      // Get controller from DI container
      const controller =
        context.container.resolve<SponsorController>("sponsorController");

      // List active sponsors
      const result = await controller.list({ activeOnly: true });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        sponsors: result.data.sponsors,
        total: result.data.total,
      };
    },
  }),
);

/**
 * Query: sponsor - Get a single sponsor by ID
 *
 * Returns a single sponsor or null if not found (public access).
 */
builder.queryField("sponsor", (t) =>
  t.field({
    description: "Get a sponsor by its ID",
    type: "Sponsor",
    nullable: true,
    args: {
      id: t.arg.id({
        description: "Sponsor ID",
        required: true,
      }),
    },
    authScopes: {
      public: true,
    },
    resolve: async (_root, args, context) => {
      // Get controller from DI container
      const controller =
        context.container.resolve<SponsorController>("sponsorController");

      // Fetch sponsor
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
 * Query: sponsorsByTrip - Get sponsors by trip ID
 *
 * Returns sponsors linked to a specific trip (public access).
 */
builder.queryField("sponsorsByTrip", (t) =>
  t.field({
    description: "Get sponsors for a specific trip",
    type: ["Sponsor"],
    authScopes: {
      public: true,
    },
    args: {
      tripId: t.arg.id({
        description: "Trip ID",
        required: true,
      }),
    },
    resolve: async (_root, args, context) => {
      // Get controller from DI container
      const controller =
        context.container.resolve<SponsorController>("sponsorController");

      // Fetch sponsors by trip
      const result = await controller.getByTripId({ tripId: args.tripId });

      if (!result.success) {
        // Return empty array for not found
        if (result.error.toLowerCase().includes("not found")) {
          return [];
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

// =============================================================================
// Mutation Fields
// =============================================================================

/**
 * Mutation: createSponsor - Create a new sponsor
 *
 * Requires admin role.
 */
builder.mutationField("createSponsor", (t) =>
  t.field({
    description: "Create a new sponsor (admin only)",
    type: "CreateSponsorPayload",
    args: {
      input: t.arg({
        type: "CreateSponsorInput",
        description: "Sponsor creation data",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<SponsorController>("sponsorController");

      // Create sponsor
      const result = await controller.create({
        name: args.input.name,
        description: args.input.description,
        logoPath: args.input.logoPath,
        height: args.input.height ?? null,
        offsetX: args.input.offsetX ?? null,
        offsetY: args.input.offsetY ?? null,
        isActive: args.input.isActive ?? true,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { sponsor: result.data };
    },
  }),
);

/**
 * Mutation: updateSponsor - Update an existing sponsor
 *
 * Requires admin role.
 */
builder.mutationField("updateSponsor", (t) =>
  t.field({
    description: "Update an existing sponsor (admin only)",
    type: "UpdateSponsorPayload",
    args: {
      input: t.arg({
        type: "UpdateSponsorInput",
        description: "Sponsor update data",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<SponsorController>("sponsorController");

      // Build update input (only include defined fields)
      const updateInput: Record<string, unknown> = {
        sponsorId: args.input.id,
      };

      if (args.input.name !== undefined) {
        updateInput.name = args.input.name;
      }
      if (args.input.description !== undefined) {
        updateInput.description = args.input.description;
      }
      if (args.input.logoPath !== undefined) {
        updateInput.logoPath = args.input.logoPath;
      }
      if (args.input.height !== undefined) {
        updateInput.height = args.input.height;
      }
      if (args.input.offsetX !== undefined) {
        updateInput.offsetX = args.input.offsetX;
      }
      if (args.input.offsetY !== undefined) {
        updateInput.offsetY = args.input.offsetY;
      }
      if (args.input.isActive !== undefined) {
        updateInput.isActive = args.input.isActive;
      }

      // Update sponsor
      const result = await controller.update(updateInput);

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { sponsor: result.data };
    },
  }),
);

/**
 * Mutation: deleteSponsor - Delete a sponsor
 *
 * Requires admin role.
 */
builder.mutationField("deleteSponsor", (t) =>
  t.field({
    description: "Delete a sponsor (admin only)",
    type: "DeleteSponsorPayload",
    args: {
      id: t.arg.id({
        description: "ID of the sponsor to delete",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<SponsorController>("sponsorController");

      // Delete sponsor
      const result = await controller.delete({ id: args.id });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        success: result.data.deleted,
        id: result.data.id,
      };
    },
  }),
);

/**
 * Mutation: linkSponsorToTrip - Link a sponsor to a trip
 *
 * Requires admin role.
 */
builder.mutationField("linkSponsorToTrip", (t) =>
  t.field({
    description: "Link a sponsor to a trip (admin only)",
    type: "LinkSponsorToTripPayload",
    args: {
      input: t.arg({
        type: "LinkSponsorToTripInput",
        description: "Link data",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<SponsorController>("sponsorController");

      // Link sponsor to trip
      const result = await controller.linkToTrip({
        sponsorId: args.input.sponsorId,
        tripId: args.input.tripId,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Mutation: unlinkSponsorFromTrip - Unlink a sponsor from a trip
 *
 * Requires admin role.
 */
builder.mutationField("unlinkSponsorFromTrip", (t) =>
  t.field({
    description: "Unlink a sponsor from a trip (admin only)",
    type: "UnlinkSponsorFromTripPayload",
    args: {
      input: t.arg({
        type: "UnlinkSponsorFromTripInput",
        description: "Unlink data",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<SponsorController>("sponsorController");

      // Unlink sponsor from trip
      const result = await controller.unlinkFromTrip({
        sponsorId: args.input.sponsorId,
        tripId: args.input.tripId,
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
