import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth } from "../../context.js";
import { ChallengeSubmissionId, ChallengeVoteId } from "@mirai-app/domain";
import { CastVoteInput, VoteResultType } from "./index.js";

builder.mutationFields((t) => ({
  castVote: t.field({
    type: VoteResultType,
    args: { input: t.arg({ type: CastVoteInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        id: ChallengeVoteId.unsafeCreate("placeholder"),
        submissionId: ChallengeSubmissionId.unsafeCreate(args.input.submissionId),
        score: args.input.voteType === "UPVOTE" ? 1 : -1,
        updatedAt: new Date(),
      };
    },
  }),
  removeVote: t.field({
    type: VoteResultType,
    args: { submissionId: t.arg.string({ required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        id: ChallengeVoteId.unsafeCreate("placeholder"),
        submissionId: ChallengeSubmissionId.unsafeCreate(args.submissionId),
        score: 0,
        updatedAt: new Date(),
      };
    },
  }),
}));

export const challengeVoteMutations = {};