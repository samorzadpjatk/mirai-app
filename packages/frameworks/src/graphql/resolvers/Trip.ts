/**
 * Trip GraphQL Resolvers
 *
 * Resolvers for Trip queries and mutations.
 * Maps TripController outputs to GraphQL responses with proper error handling.
 *
 * @module trip/resolvers
 */

import { builder } from "../builder";
import { requireAuth, requireAdmin } from "../utils/auth-helpers";
import { mapErrorToGraphQL } from "../utils/error-mapper";
import { GraphQLError } from "graphql";
import { Effect } from "effect";
import { TripRepositoryTag } from "@mirai-app/use-cases";

// =============================================================================
// Import Types (registers them with builder)
// =============================================================================

import {
  TripPaginationInput,
  CreateTripInput,
  UpdateTripInput,
  DeleteTripInput,
} from "../types/trip";

// =============================================================================
// Query Fields
// =============================================================================

/**
 * Query: trips - Get trips where current user is a participant
 *
 * Requires authentication. Returns trips filtered by participant status.
 */
builder.queryField("trips", (t) =>
  t.field({
    description: "Get trips where current user is a participant",
    type: "TripListResult",
    nullable: false,
    args: {
      pagination: t.arg({
        type: TripPaginationInput,
        description: "Pagination options",
        required: false,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Require authentication
      const authContext = await requireAuth(context);

      // Get controller from context
      const controller = context.controllers.tripController;

      // Get all trips with pagination
      const result = await controller.list({
        limit: args.pagination?.limit ?? 30,
        offset: args.pagination?.offset ?? 0,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      // Filter trips where user is a participant
      const userTrips = [];
      for (const trip of result.data) {
        // Check if user is a participant using Effect Context.Tag pattern
        const isParticipant = await Effect.runPromise(
          Effect.gen(function* () {
            const repo = yield* TripRepositoryTag;
            // Access the underlying db through the repository
            const db = (repo as { db: unknown }).db;

            if (!db) {
              return false;
            }

            // Query trip_participants table through Drizzle
            const participant = yield* Effect.tryPromise({
              try: async () => {
                const typedDb = db as { tripParticipant: unknown };
                const result = await typedDb
                  .select()
                  .from({
                    tripParticipant: typedDb.tripParticipant,
                  })
                  .where({
                    userId: authContext.userId,
                    tripId: trip.id,
                  })
                  .limit(1);
                return result[0] ?? null;
              },
              catch: () => null,
            });

            return participant !== null;
          }).pipe(Effect.provide(context.appLayer)),
        );

        if (isParticipant) {
          userTrips.push(trip);
        }
      }

      return {
        trips: userTrips,
        pagination: {
          total: userTrips.length,
          limit: args.pagination?.limit ?? 30,
          offset: args.pagination?.offset ?? 0,
          hasMore: false,
        },
      };
    },
  }),
);

/**
 * Query: trip - Get trip by ID (authenticated)
 *
 * Requires authentication. Any authenticated user can view any trip.
 */
builder.queryField("trip", (t) =>
  t.field({
    description: "Get a trip by ID",
    type: "Trip",
    nullable: true,
    args: {
      id: t.arg.id({
        description: "Trip ID to fetch",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Require authentication
      await requireAuth(context);

      // Get controller from context
      const controller = context.controllers.tripController;

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
 * Query: tripAdmin - Get trip by ID (admin only)
 *
 * Requires admin role. Used for administrative purposes.
 */
builder.queryField("tripAdmin", (t) =>
  t.field({
    description: "Get a trip by ID (admin only)",
    type: "Trip",
    nullable: true,
    args: {
      id: t.arg.id({
        description: "Trip ID to fetch",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from context
      const controller = context.controllers.tripController;

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

// =============================================================================
// Mutation Fields
// =============================================================================

/**
 * Mutation: createTrip - Create a new trip
 *
 * Requires admin role.
 */
builder.mutationField("createTrip", (t) =>
  t.field({
    description: "Create a new trip (admin only)",
    type: "Trip",
    nullable: false,
    args: {
      input: t.arg({
        type: CreateTripInput,
        description: "Input for creating trip",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from context
      const controller = context.controllers.tripController;

      const result = await controller.create({
        name: args.input.name,
        description: args.input.description ?? null,
        startDate: args.input.startDate,
        endDate: args.input.endDate,
        backgroundImagePath: args.input.backgroundImagePath ?? null,
        status: "PLANNING",
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Mutation: updateTrip - Update an existing trip
 *
 * Requires admin role.
 */
builder.mutationField("updateTrip", (t) =>
  t.field({
    description: "Update a trip (admin only)",
    type: "Trip",
    nullable: false,
    args: {
      input: t.arg({
        type: UpdateTripInput,
        description: "Input for updating trip",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from context
      const controller = context.controllers.tripController;

      const result = await controller.update({
        tripId: args.input.id,
        name: args.input.name ?? undefined,
        description: args.input.description ?? undefined,
        startDate: args.input.startDate ?? undefined,
        endDate: args.input.endDate ?? undefined,
        backgroundImagePath: args.input.backgroundImagePath ?? undefined,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Mutation: deleteTrip - Delete a trip
 *
 * Requires admin role.
 */
builder.mutationField("deleteTrip", (t) =>
  t.field({
    description: "Delete a trip (admin only)",
    type: "DeleteTripResult",
    nullable: false,
    args: {
      input: t.arg({
        type: DeleteTripInput,
        description: "Input for deleting trip",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from context
      const controller = context.controllers.tripController;

      const result = await controller.delete({ id: args.input.id });

      if (!result.success) {
        // Handle not found specifically
        if (result.error.toLowerCase().includes("not found")) {
          throw new GraphQLError(result.error, {
            extensions: { code: "NOT_FOUND" },
          });
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { success: true };
    },
  }),
);

// =============================================================================
// Export
// =============================================================================

// Resolvers are registered automatically by importing this file
export {};
