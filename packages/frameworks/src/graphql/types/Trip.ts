/**
 * Trip GraphQL Types
 *
 * Pothos type definitions for the Trip domain.
 * Maps from TripController DTOs to GraphQL schema types.
 *
 * @module trip/types
 */

import { builder } from "../builder";

// =============================================================================
// Enums
// =============================================================================

/**
 * Trip status enum for GraphQL
 */
export const TripStatusEnum = builder.enumType("TripStatus", {
  description: "Status of a trip",
  values: {
    PLANNING: { value: "PLANNING" },
    ACTIVE: { value: "ACTIVE" },
    COMPLETED: { value: "COMPLETED" },
    CANCELLED: { value: "CANCELLED" },
  },
});

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input type for pagination
 */
export const TripPaginationInput = builder.inputType("TripPaginationInput", {
  description: "Pagination input for trip queries",
  fields: (t) => ({
    limit: t.int({
      description: "Maximum number of trips to return (1-100)",
      required: false,
      defaultValue: 30,
    }),
    offset: t.int({
      description: "Number of trips to skip",
      required: false,
      defaultValue: 0,
    }),
  }),
});

/**
 * Input type for trip query
 */
export const TripByIdInput = builder.inputType("TripByIdInput", {
  description: "Input for fetching a trip by ID",
  fields: (t) => ({
    id: t.id({
      description: "Trip ID to fetch",
      required: true,
    }),
  }),
});

/**
 * Input type for create trip mutation
 */
export const CreateTripInput = builder.inputType("CreateTripInput", {
  description: "Input for creating a new trip",
  fields: (t) => ({
    name: t.string({
      description: "Trip name",
      required: true,
    }),
    description: t.string({
      description: "Trip description",
      required: false,
    }),
    startDate: t.field({
      type: "DateTime",
      description: "Trip start date",
      required: true,
    }),
    endDate: t.field({
      type: "DateTime",
      description: "Trip end date",
      required: true,
    }),
    backgroundImagePath: t.string({
      description: "URL to background image",
      required: false,
    }),
  }),
});

/**
 * Input type for update trip mutation
 */
export const UpdateTripInput = builder.inputType("UpdateTripInput", {
  description: "Input for updating a trip",
  fields: (t) => ({
    id: t.id({
      description: "Trip ID to update",
      required: true,
    }),
    name: t.string({
      description: "Trip name",
      required: false,
    }),
    description: t.string({
      description: "Trip description",
      required: false,
    }),
    startDate: t.field({
      type: "DateTime",
      description: "Trip start date",
      required: false,
    }),
    endDate: t.field({
      type: "DateTime",
      description: "Trip end date",
      required: false,
    }),
    backgroundImagePath: t.string({
      description: "URL to background image",
      required: false,
    }),
  }),
});

/**
 * Input type for delete trip mutation
 */
export const DeleteTripInput = builder.inputType("DeleteTripInput", {
  description: "Input for deleting a trip",
  fields: (t) => ({
    id: t.id({
      description: "Trip ID to delete",
      required: true,
    }),
  }),
});

// =============================================================================
// Object Types
// =============================================================================

/**
 * Trip output type
 * Matches the data returned by TripController
 */
export const TripType = builder.objectType("Trip", {
  description: "A trip/event in the application",
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "Unique trip identifier",
      nullable: false,
    }),

    name: t.exposeString("name", {
      description: "Trip name",
      nullable: false,
    }),

    description: t.exposeString("description", {
      description: "Trip description",
      nullable: true,
    }),

    startDate: t.field({
      type: "DateTime",
      description: "When the trip starts",
      nullable: false,
      resolve: (trip: { startDate: Date }) => trip.startDate,
    }),

    endDate: t.field({
      type: "DateTime",
      description: "When the trip ends",
      nullable: false,
      resolve: (trip: { endDate: Date }) => trip.endDate,
    }),

    backgroundImagePath: t.exposeString("backgroundImagePath", {
      description: "Path to background image",
      nullable: true,
    }),

    status: t.field({
      type: TripStatusEnum,
      description: "Trip status",
      nullable: false,
      resolve: (trip: { status: string }) =>
        trip.status as "PLANNING" | "ACTIVE" | "COMPLETED" | "CANCELLED",
    }),

    createdAt: t.field({
      type: "DateTime",
      description: "When the trip was created",
      nullable: false,
      resolve: (trip: { createdAt: Date }) => trip.createdAt,
    }),

    updatedAt: t.field({
      type: "DateTime",
      description: "When the trip was last updated",
      nullable: false,
      resolve: (trip: { updatedAt: Date }) => trip.updatedAt,
    }),

    // Computed status fields from TripController
    isPlanning: t.exposeBoolean("isPlanning", {
      description: "Whether the trip is in planning status",
      nullable: false,
    }),

    isActive: t.exposeBoolean("isActive", {
      description: "Whether the trip is in active status",
      nullable: false,
    }),

    isCompleted: t.exposeBoolean("isCompleted", {
      description: "Whether the trip is completed",
      nullable: false,
    }),

    isCancelled: t.exposeBoolean("isCancelled", {
      description: "Whether the trip is cancelled",
      nullable: false,
    }),
  }),
});

/**
 * Pagination info for trip list
 */
export const TripPaginationInfoType = builder.objectType("TripPaginationInfo", {
  description: "Pagination information for trip list",
  fields: (t) => ({
    total: t.exposeInt("total", {
      description: "Total number of trips",
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
      description: "Whether there are more items",
      nullable: false,
    }),
  }),
});

/**
 * Trip list result type
 */
export const TripListResultType = builder.objectType("TripListResult", {
  description: "Result of fetching a list of trips",
  fields: (t) => ({
    trips: t.field({
      type: [TripType],
      description: "List of trips",
      nullable: false,
      resolve: (result: { trips: unknown[] }) => result.trips,
    }),
    pagination: t.field({
      type: TripPaginationInfoType,
      description: "Pagination information",
      nullable: false,
      resolve: (result: { pagination: unknown }) => result.pagination,
    }),
  }),
});

/**
 * Delete trip result type
 */
export const DeleteTripResultType = builder.objectType("DeleteTripResult", {
  description: "Result of deleting a trip",
  fields: (t) => ({
    success: t.exposeBoolean("success", {
      description: "Whether deletion was successful",
      nullable: false,
    }),
  }),
});

// =============================================================================
// Export
// =============================================================================

export default TripType;
