/**
 * Challenge GraphQL Resolvers
 *
 * Resolvers for Challenge domain queries and mutations.
 * Maps use case outputs to GraphQL responses with proper error handling.
 *
 * @module Challenge/resolvers
 */

import { builder } from "../builder";
import type { GetChallengeOutput } from "@mirai-app/use-cases";
import { requireAuth, requireAdmin } from "../utils/auth-helpers";
import { mapErrorToGraphQL } from "../utils/error-mapper";

// =============================================================================
// Query Fields
// =============================================================================

/**
 * Query: challenges - Get all challenges (admin only)
 *
 * Requires admin role. Returns a list of all active challenges.
 */
builder.queryField("challenges", (t) =>
  t.field({
    description: "Get all active challenges (admin only)",
    type: ["Challenge"],
    authScopes: {
      admin: true,
    },
    resolve: async (_root, _args, context): Promise<GetChallengeOutput[]> => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from context
      const controller = context.controllers.challengeController;

      // Fetch challenges and handle result
      const result = await controller.findActive();

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      // Map to full challenge output format
      return result.data.map((challenge) => ({
        id: challenge.id,
        tripId: challenge.tripId,
        name: challenge.name,
        description: challenge.description,
        image: null,
        submissionType: challenge.submissionType,
        scoringCategory: challenge.scoringCategory,
        isRecurring: false,
        basePoints: challenge.basePoints,
        status: challenge.status,
        startTime: null,
        endTime: null,
        targetLatitude: null,
        targetLongitude: null,
        expectedValue: null,
        autoApprove: false,
        createdAt: challenge.createdAt,
        isActive: challenge.status === "ACTIVE",
        isOpenForSubmission: challenge.status === "ACTIVE",
        requiresLocation: false,
        requiresQRCode: false,
        hasVotingPhase: challenge.scoringCategory === "PEER_VOTING",
      }));
    },
  }),
);

/**
 * Query: challengesByTrip - Get challenges for a trip (authenticated)
 *
 * Requires authentication. Returns paginated challenges for a specific trip.
 */
builder.queryField("challengesByTrip", (t) =>
  t.field({
    description: "Get challenges for a specific trip",
    type: "ChallengesConnection",
    args: {
      tripId: t.arg.id({
        description: "ID of the trip",
        required: true,
      }),
      pagination: t.arg({
        type: "PaginationInput",
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

      // Get controller from context
      const controller = context.controllers.challengeController;

      // Fetch challenges by trip
      const result = await controller.getByTripId({
        tripId: args.tripId,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      const limit = args.pagination?.limit ?? 30;
      const offset = args.pagination?.offset ?? 0;
      const allChallenges = result.data;

      // Apply pagination
      const paginatedChallenges = allChallenges.slice(offset, offset + limit);

      return {
        challenges: paginatedChallenges,
        pagination: {
          total: allChallenges.length,
          limit,
          offset,
          hasMore: offset + limit < allChallenges.length,
        },
      };
    },
  }),
);

/**
 * Query: challenge - Get a single challenge by ID (authenticated)
 *
 * Requires authentication. Returns a single challenge or null if not found.
 */
builder.queryField("challenge", (t) =>
  t.field({
    description: "Get a challenge by its ID",
    type: "Challenge",
    nullable: true,
    args: {
      id: t.arg.id({
        description: "Challenge ID",
        required: true,
      }),
      tripId: t.arg.id({
        description: "Trip ID (for validation)",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (
      _root,
      args,
      context,
    ): Promise<GetChallengeOutput | null> => {
      // Require authentication
      await requireAuth(context);

      // Get controller from context
      const controller = context.controllers.challengeController;

      // Fetch challenge
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
 * Mutation: createChallenge - Create a new challenge (admin only)
 *
 * Requires admin role. Creates a new challenge with the provided data.
 */
builder.mutationField("createChallenge", (t) =>
  t.field({
    description: "Create a new challenge (admin only)",
    type: "CreateChallengePayload",
    args: {
      input: t.arg({
        type: "CreateChallengeInput",
        description: "Challenge creation data",
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
      const controller = context.controllers.challengeController;

      // Create challenge
      const result = await controller.create({
        tripId: args.input.tripId,
        name: args.input.name,
        description: args.input.description,
        image: args.input.image,
        submissionType: args.input.submissionType,
        scoringCategory: args.input.scoringCategory,
        basePoints: args.input.basePoints,
        firstPlacePoints: args.input.firstPlacePoints,
        secondPlacePoints: args.input.secondPlacePoints,
        thirdPlacePoints: args.input.thirdPlacePoints,
        status: args.input.status,
        startTime: args.input.startTime,
        endTime: args.input.endTime,
        targetLatitude: args.input.targetLatitude,
        targetLongitude: args.input.targetLongitude,
        expectedValue: args.input.expectedValue,
        autoApprove: args.input.autoApprove,
        isRecurring: false,
        dailyStartTime: null,
        dailyEndTime: null,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { challenge: result.data };
    },
  }),
);

/**
 * Mutation: updateChallenge - Update an existing challenge (admin only)
 *
 * Requires admin role. Updates challenge details.
 */
builder.mutationField("updateChallenge", (t) =>
  t.field({
    description: "Update an existing challenge (admin only)",
    type: "UpdateChallengePayload",
    args: {
      input: t.arg({
        type: "UpdateChallengeInput",
        description: "Challenge update data",
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
      const controller = context.controllers.challengeController;

      // Update challenge
      const result = await controller.update({
        challengeId: args.input.id,
        name: args.input.name,
        description: args.input.description,
        image: args.input.image,
        basePoints: args.input.basePoints,
        firstPlacePoints: args.input.firstPlacePoints,
        secondPlacePoints: args.input.secondPlacePoints,
        thirdPlacePoints: args.input.thirdPlacePoints,
        startTime: args.input.startTime,
        endTime: args.input.endTime,
        targetLatitude: args.input.targetLatitude,
        targetLongitude: args.input.targetLongitude,
        expectedValue: args.input.expectedValue,
        autoApprove: args.input.autoApprove,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { challenge: result.data };
    },
  }),
);

/**
 * Mutation: updateChallengeStatus - Update challenge status (admin only)
 *
 * Requires admin role. Transitions challenge through status workflow.
 */
builder.mutationField("updateChallengeStatus", (t) =>
  t.field({
    description: "Update a challenge's status (admin only)",
    type: "UpdateChallengeStatusPayload",
    args: {
      input: t.arg({
        type: "UpdateChallengeStatusInput",
        description: "Status update data",
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
      const controller = context.controllers.challengeController;

      // Update status
      const result = await controller.updateStatus({
        challengeId: args.input.id,
        newStatus: args.input.newStatus,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        challenge: result.data,
        previousStatus: result.data.previousStatus,
      };
    },
  }),
);

/**
 * Mutation: deleteChallenge - Delete (cancel) a challenge (admin only)
 *
 * Requires admin role. Soft-deletes a challenge by setting status to CANCELLED.
 */
builder.mutationField("deleteChallenge", (t) =>
  t.field({
    description: "Delete (cancel) a challenge (admin only)",
    type: "DeleteChallengePayload",
    args: {
      id: t.arg.id({
        description: "ID of the challenge to delete",
        required: true,
      }),
      tripId: t.arg.id({
        description: "Trip ID (for validation)",
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
      const controller = context.controllers.challengeController;

      // Cancel (soft delete) the challenge
      const result = await controller.updateStatus({
        challengeId: args.id,
        newStatus: "CANCELLED",
      });

      if (!result.success) {
        // Return specific error for not found
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

// =============================================================================
// Export
// =============================================================================

// Resolvers are registered automatically by importing this file
export {};
