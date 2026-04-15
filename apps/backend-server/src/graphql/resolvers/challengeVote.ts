/**
 * ChallengeVote GraphQL Resolvers
 *
 * Resolvers for ChallengeVote domain queries and mutations.
 * Maps use case outputs to GraphQL responses with proper error handling.
 *
 * ## Queries
 *
 * - myVotes(challengeId: ID!, tripId: ID!): ChallengeVoteList
 * - votesByChallenge(challengeId: ID!): ChallengeVoteAdminList
 * - votingProgress(challengeId: ID!): VotingProgress
 * - judgedStaffVotingProgress(input: GetJudgedStaffVotingProgressInput!): JudgedStaffVotingProgress
 *
 * ## Mutations
 *
 * - submitVote(input: SubmitVoteInput!): SubmitVotePayload
 * - submitVotes(input: SubmitVotesInput!): SubmitVotesPayload
 * - forceEndVoting(input: ForceEndVotingInput!): ForceEndVotingPayload
 *
 * @module ChallengeVote/resolvers
 */

import { builder } from "../builder";
import type {
  VoteDTO,
  ChallengeVoteDTO,
  GetMyVotesOutput,
  GetVotesByChallengeOutput,
  GetChallengeVotingProgressOutput,
  GetJudgedStaffVotingProgressOutput,
  SubmitVoteOutput,
  SubmitVotesOutput,
  ForceEndVotingOutput,
} from "@mirai-app/use-cases";
import { PubSubServiceTag } from "@mirai-app/use-cases";
import { Effect } from "effect";
import {
  requireAuth,
  requireModerator,
  requireAdmin,
} from "../utils/auth-helpers";
import {
  mapErrorToGraphQL,
  throwForbidden,
  throwBadInput,
} from "../utils/error-mapper";
import {
  ChallengeVoteListType,
  ChallengeVoteAdminListType,
  VotingProgressType,
  JudgedStaffVotingProgressType,
  SubmitVotePayloadType,
  SubmitVotesPayloadType,
  ForceEndVotingPayloadType,
  GetMyVotesInput,
  GetVotesByChallengeInput,
  GetVotingProgressInput,
  GetJudgedStaffVotingProgressInput,
  SubmitVoteInput,
  SubmitVotesInput,
  ForceEndVotingInput,
} from "../types/challengeVote";

// =============================================================================
// Query Fields
// =============================================================================

/**
 * Query: myVotes - Get my votes for a challenge
 *
 * Authenticated users can view their own votes.
 * Validates that the user is a participant in the trip.
 */
builder.queryField("myVotes", (t) =>
  t.field({
    description: "Get my votes for a specific challenge",
    type: ChallengeVoteListType,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({
        type: GetMyVotesInput,
        description: "Input with challenge and trip IDs",
        required: true,
      }),
    },
    resolve: async (_root, args, context): Promise<GetMyVotesOutput> => {
      // Require authentication
      const authContext = await requireAuth(context);

      // Get controller from context
      const controller = context.controllers.challengeVoteController;

      // Call controller - participant validation happens in use case layer
      const result = await controller.getMyVotes({
        challengeId: args.input.challengeId.toString(),
        voterId: authContext.userId, // Using userId as voterId (mapped in use case)
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Query: votesByChallenge - Get all votes for a challenge
 *
 * Requires moderator or admin role.
 * Used for viewing voting results and analytics.
 */
builder.queryField("votesByChallenge", (t) =>
  t.field({
    description: "Get all votes for a challenge (moderator/admin only)",
    type: ChallengeVoteAdminListType,
    authScopes: { moderator: true },
    args: {
      input: t.arg({
        type: GetVotesByChallengeInput,
        description: "Input with challenge ID",
        required: true,
      }),
    },
    resolve: async (
      _root,
      args,
      context,
    ): Promise<GetVotesByChallengeOutput> => {
      // Require moderator authentication
      await requireModerator(context);

      // Get controller from context
      const controller = context.controllers.challengeVoteController;

      const result = await controller.getByChallenge({
        challengeId: args.input.challengeId.toString(),
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Query: votingProgress - Get voting progress for a challenge
 *
 * Authenticated users can view voting progress.
 * Returns vote counts and scores per submission.
 */
builder.queryField("votingProgress", (t) =>
  t.field({
    description: "Get voting progress for a challenge",
    type: VotingProgressType,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({
        type: GetVotingProgressInput,
        description: "Input with challenge ID",
        required: true,
      }),
    },
    resolve: async (
      _root,
      args,
      context,
    ): Promise<GetChallengeVotingProgressOutput> => {
      // Require authentication
      await requireAuth(context);

      // Get controller from context
      const controller = context.controllers.challengeVoteController;

      const result = await controller.getVotingProgress({
        challengeId: args.input.challengeId.toString(),
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Query: judgedStaffVotingProgress - Get judged staff voting progress
 *
 * Requires moderator or admin role.
 * Tracks which admins have completed voting.
 */
builder.queryField("judgedStaffVotingProgress", (t) =>
  t.field({
    description: "Get judged staff voting progress (moderator/admin only)",
    type: JudgedStaffVotingProgressType,
    authScopes: { moderator: true },
    args: {
      input: t.arg({
        type: GetJudgedStaffVotingProgressInput,
        description: "Input with challenge, trip, and admin details",
        required: true,
      }),
    },
    resolve: async (
      _root,
      args,
      context,
    ): Promise<GetJudgedStaffVotingProgressOutput> => {
      // Require moderator authentication
      await requireModerator(context);

      // Get controller from context
      const controller = context.controllers.challengeVoteController;

      const result = await controller.getJudgedStaffProgress({
        challengeId: args.input.challengeId.toString(),
        tripId: args.input.tripId.toString(),
        adminParticipantIds: args.input.adminParticipantIds.map((id) =>
          id.toString(),
        ),
        requiredPositions: args.input.requiredPositions,
        eligibleSubmissionsCount: args.input.eligibleSubmissionsCount,
      });

      if (!result.success) {
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
 * Mutation: submitVote - Submit a single vote
 *
 * Authenticated users can submit a vote for a challenge.
 * Validates trip participation and prevents self-voting.
 */
builder.mutationField("submitVote", (t) =>
  t.field({
    description: "Submit a single vote for a challenge submission",
    type: SubmitVotePayloadType,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({
        type: SubmitVoteInput,
        description: "Vote submission data",
        required: true,
      }),
    },
    resolve: async (_root, args, context): Promise<SubmitVoteOutput> => {
      // Require authentication and get user context
      const authContext = await requireAuth(context);

      // Get controller from context
      const controller = context.controllers.challengeVoteController;

      // Submit vote
      const result = await controller.submitVote({
        challengeId: args.input.challengeId.toString(),
        submissionId: args.input.submissionId.toString(),
        voterId: authContext.userId,
        position: args.input.votePosition,
        points: args.input.votePoints ?? undefined,
        normalizedWeight: args.input.normalizedWeight ?? undefined,
        allowPartial: false,
      });

      if (!result.success) {
        // Map specific error codes
        if (result.error.toLowerCase().includes("already")) {
          throw mapErrorToGraphQL(
            Object.assign(new Error(result.error), { name: "ConflictError" }),
          );
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      // Fetch and publish updated voting progress
      const progressResult = await controller.getVotingProgress({
        challengeId: args.input.challengeId.toString(),
      });

      if (progressResult.success) {
        const publishEffect = Effect.gen(function* () {
          const pubSubService = yield* PubSubServiceTag;
          pubSubService.publish(
            `voting:${args.input.challengeId}`,
            progressResult.data,
          );
        }).pipe(Effect.provide(context.appLayer));

        await Effect.runPromise(publishEffect);
      }

      return result.data;
    },
  }),
);

/**
 * Mutation: submitVotes - Submit multiple votes (batch)
 *
 * Authenticated users can submit multiple votes at once.
 * Validates all positions are unique and required positions are filled.
 */
builder.mutationField("submitVotes", (t) =>
  t.field({
    description: "Submit multiple votes for a challenge (batch)",
    type: SubmitVotesPayloadType,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({
        type: SubmitVotesInput,
        description: "Batch vote submission data",
        required: true,
      }),
    },
    resolve: async (_root, args, context): Promise<SubmitVotesOutput> => {
      // Require authentication and get user context
      const authContext = await requireAuth(context);

      // Get controller from context
      const controller = context.controllers.challengeVoteController;

      // Calculate required positions from vote count
      const voteCount = args.input.votes.length;
      const requiredPositions = voteCount;

      // Submit votes
      const result = await controller.submitVotes({
        challengeId: args.input.challengeId.toString(),
        voterId: authContext.userId,
        votes: args.input.votes.map((v) => ({
          submissionId: v.submissionId.toString(),
          position: v.votePosition,
          points: v.votePoints ?? undefined,
          normalizedWeight: v.normalizedWeight ?? undefined,
        })),
        requiredPositions,
      });

      if (!result.success) {
        // Map specific error codes
        if (result.error.toLowerCase().includes("already voted")) {
          throw mapErrorToGraphQL(
            Object.assign(new Error(result.error), { name: "ConflictError" }),
          );
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      // Fetch and publish updated voting progress
      const progressResult = await controller.getVotingProgress({
        challengeId: args.input.challengeId.toString(),
      });

      if (progressResult.success) {
        const publishEffect = Effect.gen(function* () {
          const pubSubService = yield* PubSubServiceTag;
          pubSubService.publish(
            `voting:${args.input.challengeId}`,
            progressResult.data,
          );
        }).pipe(Effect.provide(context.appLayer));

        await Effect.runPromise(publishEffect);
      }

      return result.data;
    },
  }),
);

/**
 * Mutation: forceEndVoting - Force end of judged staff voting
 *
 * Admin only. Forces the completion of voting for a judged staff challenge.
 * Recomputes vote scores and marks challenge as completed.
 */
builder.mutationField("forceEndVoting", (t) =>
  t.field({
    description:
      "Force the end of voting for a judged staff challenge (admin only)",
    type: ForceEndVotingPayloadType,
    authScopes: { admin: true },
    args: {
      input: t.arg({
        type: ForceEndVotingInput,
        description: "Force end voting input",
        required: true,
      }),
    },
    resolve: async (_root, args, context): Promise<ForceEndVotingOutput> => {
      // Require admin authentication and get user context
      const authContext = await requireAdmin(context);

      // Get controller from context
      const controller = context.controllers.challengeVoteController;

      const result = await controller.forceEndVoting({
        challengeId: args.input.challengeId.toString(),
        tripId: args.input.tripId.toString(),
        adminId: authContext.userId,
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
