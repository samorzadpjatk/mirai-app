/**
 * ChallengeSubmission GraphQL Resolvers
 *
 * Resolvers for ChallengeSubmission domain queries and mutations.
 * Maps use case outputs to GraphQL responses with proper error handling.
 *
 * ## Queries
 *
 * - challengeSubmission(id: ID!): ChallengeSubmission
 * - challengeSubmissionByChallengeAndGroup(challengeId: ID!, groupId: ID!): ChallengeSubmission
 * - challengeSubmissions(challengeId: ID!, ...filters): ChallengeSubmissionListResult
 *
 * ## Mutations
 *
 * - createChallengeSubmission(input: CreateSubmissionInput!): ChallengeSubmissionCreateResult
 * - updateChallengeSubmission(input: UpdateSubmissionInput!): ChallengeSubmissionUpdateResult
 * - deleteChallengeSubmission(submissionId: ID!): Boolean
 *
 * @module ChallengeSubmission/resolvers
 */

import { builder } from "../builder";
import { ChallengeSubmissionController } from "@mirai-app/adapters";
import type {
  GetSubmissionOutput,
  CreateSubmissionOutput,
  UpdateSubmissionOutput,
  ListSubmissionsByChallengeOutput,
} from "@mirai-app/use-cases";
import { requireAuth } from "../utils/auth-helpers";
import {
  ChallengeSubmissionType,
  ChallengeSubmissionListResultType,
  ChallengeSubmissionCreateResultType,
  ChallengeSubmissionUpdateResultType,
  SubmissionOrderByEnum,
  OrderDirectionEnum,
  CreateSubmissionInput,
  UpdateSubmissionInput,
} from "../types/challengeSubmission";

// =============================================================================
// Query Fields
// =============================================================================

/**
 * Query: challengeSubmission(id: ID!) - Get submission by ID
 *
 * Public access. Returns null if submission not found.
 */
builder.queryField("challengeSubmission", (t) =>
  t.field({
    description: "Get a challenge submission by its unique ID",
    type: ChallengeSubmissionType,
    nullable: true,
    authScopes: { public: true },
    args: {
      id: t.arg.id({
        description: "Submission ID to fetch",
        required: true,
      }),
    },
    resolve: async (
      _root,
      args,
      context,
    ): Promise<GetSubmissionOutput | null> => {
      const controller =
        context.container.resolve<ChallengeSubmissionController>(
          "challengeSubmissionController",
        );

      const result = await controller.getById({
        submissionId: args.id.toString(),
      });

      // Handle errors manually to support "not found" -> null semantics
      if (result.success === false) {
        const error = result.error.toLowerCase();
        if (error.includes("not found")) {
          return null;
        }
        throw new Error(result.error);
      }

      return result.data;
    },
  }),
);

/**
 * Query: challengeSubmissionByChallengeAndGroup - Get submission by composite key
 *
 * Public access. Returns null if submission not found.
 */
builder.queryField("challengeSubmissionByChallengeAndGroup", (t) =>
  t.field({
    description: "Get a submission by challenge ID and group ID",
    type: ChallengeSubmissionType,
    nullable: true,
    authScopes: { public: true },
    args: {
      challengeId: t.arg.id({
        description: "Challenge ID",
        required: true,
      }),
      groupId: t.arg.id({
        description: "Group ID",
        required: true,
      }),
    },
    resolve: async (
      _root,
      args,
      context,
    ): Promise<GetSubmissionOutput | null> => {
      const controller =
        context.container.resolve<ChallengeSubmissionController>(
          "challengeSubmissionController",
        );

      const result = await controller.getByChallengeAndGroup({
        challengeId: args.challengeId.toString(),
        groupId: args.groupId.toString(),
      });

      if (result.success === false) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),
);

/**
 * Query: challengeSubmissions - List submissions for a challenge
 *
 * Public access. Supports pagination and sorting.
 */
builder.queryField("challengeSubmissions", (t) =>
  t.field({
    description:
      "List all submissions for a challenge with pagination and sorting",
    type: ChallengeSubmissionListResultType,
    authScopes: { public: true },
    args: {
      challengeId: t.arg.id({
        description: "Challenge ID to list submissions for",
        required: true,
      }),
      orderBy: t.arg({
        type: SubmissionOrderByEnum,
        description: "Field to order by",
        required: false,
        defaultValue: "voteScore",
      }),
      orderDirection: t.arg({
        type: OrderDirectionEnum,
        description: "Sort direction",
        required: false,
        defaultValue: "desc",
      }),
      limit: t.arg.int({
        description: "Maximum number of results (1-100)",
        required: false,
        defaultValue: 20,
      }),
      offset: t.arg.int({
        description: "Number of results to skip",
        required: false,
        defaultValue: 0,
      }),
    },
    resolve: async (
      _root,
      args,
      context,
    ): Promise<ListSubmissionsByChallengeOutput> => {
      const controller =
        context.container.resolve<ChallengeSubmissionController>(
          "challengeSubmissionController",
        );

      const result = await controller.listByChallenge({
        challengeId: args.challengeId.toString(),
        orderBy: args.orderBy ?? "voteScore",
        orderDirection: args.orderDirection ?? "desc",
        limit: args.limit ?? 20,
        offset: args.offset ?? 0,
      });

      if (result.success === false) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),
);

// =============================================================================
// Mutation Fields
// =============================================================================

/**
 * Mutation: createChallengeSubmission - Create a new submission
 *
 * Requires authentication. Creates a submission for the specified challenge and group.
 */
builder.mutationField("createChallengeSubmission", (t) =>
  t.field({
    description: "Create a new challenge submission",
    type: ChallengeSubmissionCreateResultType,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({
        type: CreateSubmissionInput,
        description: "Submission creation input",
        required: true,
      }),
    },
    resolve: async (_root, args, context): Promise<CreateSubmissionOutput> => {
      // Require authentication
      await requireAuth(context);

      const controller =
        context.container.resolve<ChallengeSubmissionController>(
          "challengeSubmissionController",
        );

      const result = await controller.create({
        challengeId: args.input.challengeId.toString(),
        groupId: args.input.groupId.toString(),
        imageIds: args.input.imageIds ?? undefined,
        videoId: args.input.videoId ?? undefined,
        textContent: args.input.textContent ?? undefined,
        latitude: args.input.latitude ?? undefined,
        longitude: args.input.longitude ?? undefined,
      });

      if (result.success === false) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),
);

/**
 * Mutation: updateChallengeSubmission - Update a submission
 *
 * Requires authentication. Can update content (if pending) or review (moderator only).
 */
builder.mutationField("updateChallengeSubmission", (t) =>
  t.field({
    description: "Update a challenge submission (content or review)",
    type: ChallengeSubmissionUpdateResultType,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({
        type: UpdateSubmissionInput,
        description: "Submission update input",
        required: true,
      }),
    },
    resolve: async (_root, args, context): Promise<UpdateSubmissionOutput> => {
      // Require at least authentication
      const authContext = await requireAuth(context);

      const controller =
        context.container.resolve<ChallengeSubmissionController>(
          "challengeSubmissionController",
        );

      const result = await controller.update({
        submissionId: args.input.submissionId.toString(),
        // Content fields
        imageIds: args.input.imageIds ?? undefined,
        videoId: args.input.videoId === null ? null : args.input.videoId,
        textContent:
          args.input.textContent === null ? null : args.input.textContent,
        latitude: args.input.latitude === null ? null : args.input.latitude,
        longitude: args.input.longitude === null ? null : args.input.longitude,
        // Review fields
        reviewAction: args.input.reviewAction ?? undefined,
        reviewedById: args.input.reviewedById ?? authContext.userId,
        rejectionReason: args.input.rejectionReason ?? undefined,
        awardedPoints: args.input.awardedPoints ?? undefined,
        bonusPoints: args.input.bonusPoints ?? undefined,
        ranking: args.input.ranking === null ? null : args.input.ranking,
      });

      if (result.success === false) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),
);

/**
 * Mutation: deleteChallengeSubmission - Delete a submission
 *
 * Requires authentication. Can only delete pending submissions.
 */
builder.mutationField("deleteChallengeSubmission", (t) =>
  t.field({
    description:
      "Delete a challenge submission (only allowed for pending submissions)",
    type: "Boolean",
    authScopes: { authenticated: true },
    args: {
      submissionId: t.arg.id({
        description: "ID of the submission to delete",
        required: true,
      }),
    },
    resolve: async (_root, args, context): Promise<boolean> => {
      // Require authentication
      await requireAuth(context);

      const controller =
        context.container.resolve<ChallengeSubmissionController>(
          "challengeSubmissionController",
        );

      const result = await controller.delete({
        submissionId: args.submissionId.toString(),
      });

      if (result.success === false) {
        throw new Error(result.error);
      }

      return result.data.success;
    },
  }),
);

// =============================================================================
// Export
// =============================================================================

// Resolvers are registered automatically by importing this file
export {};
