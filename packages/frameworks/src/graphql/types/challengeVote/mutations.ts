// =============================================================================
// Challenge Vote Mutations - Effect DI Pattern (Backend Judging)
// =============================================================================

import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, runEffect } from "../../context.js";
import { mapErrorToGraphQL } from "../../errors.js";
import { CastVoteInput, VoteResultType } from "./index.js";

// Import use cases
import {
  SubmitVoteUseCase,
  RemoveVoteUseCase,
} from "@mirai-app/use-cases/challenge-vote";

// Input type for removing votes
const RemoveVoteInput = builder.inputType("RemoveVoteInput", {
  fields: (t) => ({
    submissionId: t.string({ required: true }),
    tripId: t.string({ required: true }),
    challengeId: t.string({ required: true }),
  }),
});

builder.mutationFields((t) => ({
  castVote: t.field({
    type: VoteResultType,
    args: { input: t.arg({ type: CastVoteInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAuth(context);

      // Note: The GraphQL schema uses a simplified voteType (UPVOTE/DOWNVOTE)
      // but the backend uses votePosition (1, 2, 3) for judged staff challenges
      // and score-based voting for peer voting. For now, we map voteType to
      // a default position/points.

      const useCase = new SubmitVoteUseCase();

      // Map voteType to position/points
      // UPVOTE = position 1 (first place) with default points
      // DOWNVOTE = not applicable for judged staff challenges
      const votePosition = args.input.voteType === "UPVOTE" ? 1 : 2;
      const votePoints = args.input.voteType === "UPVOTE" ? 3 : 1;

      const effect = useCase.execute({
        tripId: args.input.tripId,
        challengeId: args.input.challengeId,
        userId: auth.userId,
        userRole: auth.role,
        submissionId: args.input.submissionId,
        votePosition,
        votePoints,
        normalizedWeight: 1.0,
      });

      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),
  removeVote: t.field({
    type: VoteResultType,
    args: { input: t.arg({ type: RemoveVoteInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAuth(context);

      const useCase = new RemoveVoteUseCase();
      const effect = useCase.execute({
        submissionId: args.input.submissionId,
        tripId: args.input.tripId,
        challengeId: args.input.challengeId,
        userId: auth.userId,
      });

      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),
}));

export const challengeVoteMutations = {};