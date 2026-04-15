/**
 * Sponsor GraphQL Types
 *
 * Pothos type definitions for the Sponsor domain.
 * Maps from Sponsor DTOs to GraphQL schema types.
 *
 * @module sponsor/types
 */

import { builder } from "../builder";
import type { SponsorController } from "@mirai-app/adapters";

// =============================================================================
// Sponsor Object Type
// =============================================================================

/**
 * Sponsor type for GraphQL schema
 *
 * Represents a trip sponsor with logo and display settings.
 */
export const SponsorType = builder.objectType("Sponsor", {
  description: "A sponsor for a trip with logo and display settings",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    // -------------------------------------------------------------------------
    // Identity Fields
    // -------------------------------------------------------------------------

    id: t.exposeID("id", {
      description: "Unique identifier for the sponsor",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Basic Fields
    // -------------------------------------------------------------------------

    name: t.exposeString("name", {
      description: "Sponsor name",
      nullable: false,
    }),

    description: t.exposeString("description", {
      description: "Sponsor description",
      nullable: false,
    }),

    logoPath: t.exposeString("logoPath", {
      description: "URL path to sponsor logo image",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Display Settings
    // -------------------------------------------------------------------------

    height: t.exposeInt("height", {
      description: "Logo height in pixels (for custom sizing)",
      nullable: true,
    }),

    offsetX: t.exposeInt("offsetX", {
      description: "Horizontal offset in pixels",
      nullable: true,
    }),

    offsetY: t.exposeInt("offsetY", {
      description: "Vertical offset in pixels",
      nullable: true,
    }),

    isActive: t.exposeBoolean("isActive", {
      description: "Whether the sponsor is currently active",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Computed Fields
    // -------------------------------------------------------------------------

    hasLogoAdjustments: t.boolean({
      description: "Whether the sponsor has custom logo sizing/positioning",
      nullable: false,
      resolve: (sponsor) =>
        sponsor.height !== null ||
        sponsor.offsetX !== null ||
        sponsor.offsetY !== null,
    }),

    // -------------------------------------------------------------------------
    // Timestamp Fields
    // -------------------------------------------------------------------------

    createdAt: t.field({
      type: "DateTime",
      description: "When the sponsor was created",
      nullable: false,
      resolve: (sponsor) => (sponsor as { createdAt: Date }).createdAt,
    }),

    updatedAt: t.field({
      type: "DateTime",
      description: "When the sponsor was last updated",
      nullable: true,
      resolve: (sponsor) => (sponsor as { updatedAt?: Date }).updatedAt ?? null,
    }),
  }),
});

// =============================================================================
// List Result Type
// =============================================================================

/**
 * Sponsor list result with pagination
 */
export const SponsorListResultType = builder.objectType("SponsorListResult", {
  description: "Result of listing sponsors",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    sponsors: t.field({
      type: [SponsorType],
      description: "List of sponsors",
      nullable: false,
      resolve: (result) => (result as { sponsors: unknown[] }).sponsors,
    }),
    total: t.exposeInt("total", {
      description: "Total number of sponsors matching the query",
      nullable: false,
    }),
  }),
});

// =============================================================================
// Mutation Payload Types
// =============================================================================

/**
 * Payload for create sponsor mutation
 */
export const CreateSponsorPayloadType = builder.objectType(
  "CreateSponsorPayload",
  {
    description: "Result of creating a sponsor",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      sponsor: t.field({
        type: SponsorType,
        description: "The newly created sponsor",
        nullable: false,
        resolve: (payload) => (payload as { sponsor: unknown }).sponsor,
      }),
    }),
  },
);

/**
 * Payload for update sponsor mutation
 */
export const UpdateSponsorPayloadType = builder.objectType(
  "UpdateSponsorPayload",
  {
    description: "Result of updating a sponsor",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      sponsor: t.field({
        type: SponsorType,
        description: "The updated sponsor",
        nullable: false,
        resolve: (payload) => (payload as { sponsor: unknown }).sponsor,
      }),
    }),
  },
);

/**
 * Payload for delete sponsor mutation
 */
export const DeleteSponsorPayloadType = builder.objectType(
  "DeleteSponsorPayload",
  {
    description: "Result of deleting a sponsor",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      success: t.exposeBoolean("success", {
        description: "Whether the deletion was successful",
        nullable: false,
      }),
      id: t.exposeID("id", {
        description: "ID of the deleted sponsor",
        nullable: false,
      }),
    }),
  },
);

/**
 * Payload for link sponsor to trip mutation
 */
export const LinkSponsorToTripPayloadType = builder.objectType(
  "LinkSponsorToTripPayload",
  {
    description: "Result of linking a sponsor to a trip",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      sponsorId: t.exposeID("sponsorId", {
        description: "ID of the sponsor",
        nullable: false,
      }),
      tripId: t.exposeID("tripId", {
        description: "ID of the trip",
        nullable: false,
      }),
      linked: t.exposeBoolean("linked", {
        description: "Whether the link was successful",
        nullable: false,
      }),
    }),
  },
);

/**
 * Payload for unlink sponsor from trip mutation
 */
export const UnlinkSponsorFromTripPayloadType = builder.objectType(
  "UnlinkSponsorFromTripPayload",
  {
    description: "Result of unlinking a sponsor from a trip",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      sponsorId: t.exposeID("sponsorId", {
        description: "ID of the sponsor",
        nullable: false,
      }),
      tripId: t.exposeID("tripId", {
        description: "ID of the trip",
        nullable: false,
      }),
      unlinked: t.exposeBoolean("unlinked", {
        description: "Whether the unlink was successful",
        nullable: false,
      }),
    }),
  },
);

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for creating a sponsor
 */
export const CreateSponsorInput = builder.inputType("CreateSponsorInput", {
  description: "Input for creating a new sponsor",
  fields: (t) => ({
    name: t.string({
      description: "Sponsor name (1-200 characters)",
      required: true,
    }),
    description: t.string({
      description: "Sponsor description (1-2000 characters)",
      required: true,
    }),
    logoPath: t.string({
      description: "URL path to sponsor logo image",
      required: true,
    }),
    height: t.int({
      description: "Logo height in pixels (optional)",
      required: false,
    }),
    offsetX: t.int({
      description: "Horizontal offset in pixels (optional)",
      required: false,
    }),
    offsetY: t.int({
      description: "Vertical offset in pixels (optional)",
      required: false,
    }),
    isActive: t.boolean({
      description: "Whether the sponsor is active",
      required: false,
      defaultValue: true,
    }),
  }),
});

/**
 * Input for updating a sponsor
 */
export const UpdateSponsorInput = builder.inputType("UpdateSponsorInput", {
  description: "Input for updating an existing sponsor",
  fields: (t) => ({
    id: t.id({
      description: "ID of the sponsor to update",
      required: true,
    }),
    name: t.string({
      description: "New sponsor name (1-200 characters)",
      required: false,
    }),
    description: t.string({
      description: "New sponsor description (1-2000 characters)",
      required: false,
    }),
    logoPath: t.string({
      description: "New logo URL path",
      required: false,
    }),
    height: t.int({
      description: "New logo height in pixels (null to clear)",
      required: false,
    }),
    offsetX: t.int({
      description: "New horizontal offset in pixels (null to clear)",
      required: false,
    }),
    offsetY: t.int({
      description: "New vertical offset in pixels (null to clear)",
      required: false,
    }),
    isActive: t.boolean({
      description: "New active status",
      required: false,
    }),
  }),
});

/**
 * Input for linking sponsor to trip
 */
export const LinkSponsorToTripInput = builder.inputType(
  "LinkSponsorToTripInput",
  {
    description: "Input for linking a sponsor to a trip",
    fields: (t) => ({
      sponsorId: t.id({
        description: "ID of the sponsor to link",
        required: true,
      }),
      tripId: t.id({
        description: "ID of the trip to link to",
        required: true,
      }),
    }),
  },
);

/**
 * Input for unlinking sponsor from trip
 */
export const UnlinkSponsorFromTripInput = builder.inputType(
  "UnlinkSponsorFromTripInput",
  {
    description: "Input for unlinking a sponsor from a trip",
    fields: (t) => ({
      sponsorId: t.id({
        description: "ID of the sponsor to unlink",
        required: true,
      }),
      tripId: t.id({
        description: "ID of the trip to unlink from",
        required: true,
      }),
    }),
  },
);

// =============================================================================
// Export
// =============================================================================

export { SponsorType as default };
