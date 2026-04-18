import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth } from "../../context.js";
import { ChallengeVoteType } from "./index.js";

builder.queryFields((t) => ({
  myVotes: t.field({
    type: [ChallengeVoteType],
    args: { challengeId: t.arg.string({ required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return [];
    },
  }),
  submissionVotes: t.field({
    type: [ChallengeVoteType],
    args: { submissionId: t.arg.string({ required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return [];
    },
  }),
}));
