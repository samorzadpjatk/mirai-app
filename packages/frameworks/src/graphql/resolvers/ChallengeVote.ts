import { builder } from "../builder.js";
import { ChallengeVote } from "../../../domain/src/entities/ChallengeVote.js";
import type { GraphQLContext } from "../builder.js";
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
      const controller = ctx.container.resolve("challengeVoteController");
      const result = await controller.getByChallengeId(
        { challengeId: args.challengeId },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
      }
      return result.value;
    },
  }),

  myVotes: t.field({
    type: [ChallengeVote],
    args: {
      challengeId: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.container.resolve("challengeVoteController");
      const result = await controller.getMyVotes(
        { challengeId: args.challengeId },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
      }
      return result.value;
    },
  }),

  hasVoted: t.field({
    type: "Boolean",
    args: {
      challengeId: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.container.resolve("challengeVoteController");
      const result = await controller.hasVoted(
        { challengeId: args.challengeId },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
      }
      return result.value;
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
      const controller = ctx.container.resolve("challengeVoteController");
      const result = await controller.getVotingProgress(
        { challengeId: args.challengeId },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
      }
      return result.value;
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
      const controller = ctx.container.resolve("challengeVoteController");
      const result = await controller.submitVote(args, ctx.container);
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "BAD_REQUEST" } });
      }
      return result.value;
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
      const controller = ctx.container.resolve("challengeVoteController");
      const result = await controller.submitVotes(
        {
          challengeId: args.challengeId,
          votes: args.votes.map((v) => ({
            submissionId: v.submissionId,
            position: v.position as "UPVOTE" | "DOWNVOTE" | "NEUTRAL",
          })),
        },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "BAD_REQUEST" } });
      }
      return result.value;
    },
  }),

  forceEndVoting: t.field({
    type: "Boolean",
    args: {
      challengeId: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.container.resolve("challengeVoteController");
      const result = await controller.forceEndVoting(
        { challengeId: args.challengeId },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "BAD_REQUEST" } });
      }
      return result.value;
    },
  }),
}));
