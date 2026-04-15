import { builder } from "../builder";
import { ChallengeVote } from "@mirai-app/domain";
import type { GraphQLContext } from "../builder";
import { GraphQLError } from "graphql";

/**
 * ChallengeVote Resolvers
 *
 * GraphQL resolvers for ChallengeVote domain.
 */

// Enum for vote position
const VotePositionEnum = builder.enumType("VotePosition", {
  values: ["UPVOTE", "DOWNVOTE", "NEUTRAL"] as const,
});

// ChallengeVote type
builder.node(ChallengeVote, {
  id: { resolve: (cv) => cv.id },
  name: "ChallengeVote",
  fields: (t) => ({
    id: t.exposeID("id"),
    challengeId: t.exposeString("challengeId"),
    submissionId: t.exposeString("submissionId"),
    voterId: t.exposeString("voterId"),
    position: t.field({
      type: VotePositionEnum,
      resolve: (cv) => cv.position as "UPVOTE" | "DOWNVOTE" | "NEUTRAL",
    }),
    weight: t.exposeInt("weight"),
    isStaffVote: t.exposeBoolean("isStaffVote"),
    votedAt: t.field({
      type: "DateTime",
      resolve: (cv) => cv.votedAt,
    }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (cv) => cv.createdAt,
    }),
  }),
});

// Queries
builder.queryFields((t) => ({
  challengeVotes: t.field({
    type: [ChallengeVote],
    args: {
      challengeId: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.challengeVoteController;
      const result = await controller.getByChallengeId({
        challengeId: args.challengeId,
      });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return result.data;
    },
  }),

  myVotes: t.field({
    type: [ChallengeVote],
    args: {
      challengeId: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.challengeVoteController;
      const result = await controller.getMyVotes({
        challengeId: args.challengeId,
      });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return result.data;
    },
  }),

  hasVoted: t.field({
    type: "Boolean",
    args: {
      challengeId: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.challengeVoteController;
      const result = await controller.hasVoted({
        challengeId: args.challengeId,
      });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return result.data;
    },
  }),

  votingProgress: t.field({
    type: builder.objectType("VotingProgress", {
      fields: (t) => ({
        totalVotes: t.exposeInt("totalVotes"),
        requiredVotes: t.exposeInt("requiredVotes"),
        isComplete: t.exposeBoolean("isComplete"),
        progress: t.exposeFloat("progress"),
      }),
    }),
    args: {
      challengeId: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.challengeVoteController;
      const result = await controller.getVotingProgress({
        challengeId: args.challengeId,
      });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return result.data;
    },
  }),
}));

// Mutations
builder.mutationFields((t) => ({
  submitVote: t.field({
    type: ChallengeVote,
    args: {
      challengeId: t.arg.string({ required: true }),
      submissionId: t.arg.string({ required: true }),
      position: t.arg({ type: VotePositionEnum, required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.challengeVoteController;
      const result = await controller.submitVote(args);
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "BAD_REQUEST" },
        });
      }
      return result.data;
    },
  }),

  submitVotes: t.field({
    type: [ChallengeVote],
    args: {
      challengeId: t.arg.string({ required: true }),
      votes: t.arg(
        builder.inputType("VoteInput", {
          fields: (t) => ({
            submissionId: t.string({ required: true }),
            position: t.field({ type: VotePositionEnum, required: true }),
          }),
        }),
        { required: true, list: true },
      ),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.challengeVoteController;
      const result = await controller.submitVotes({
        challengeId: args.challengeId,
        votes: args.votes.map((v) => ({
          submissionId: v.submissionId,
          position: v.position as "UPVOTE" | "DOWNVOTE" | "NEUTRAL",
        })),
      });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "BAD_REQUEST" },
        });
      }
      return result.data;
    },
  }),

  forceEndVoting: t.field({
    type: "Boolean",
    args: {
      challengeId: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.challengeVoteController;
      const result = await controller.forceEndVoting({
        challengeId: args.challengeId,
      });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "BAD_REQUEST" },
        });
      }
      return result.data;
    },
  }),
}));
