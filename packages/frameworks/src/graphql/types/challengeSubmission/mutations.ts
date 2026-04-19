// =============================================================================
// Challenge Submission Mutations - Effect DI Pattern
// =============================================================================

import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, requireModerator, runEffect } from "../../context.js";
import { mapErrorToGraphQL } from "../../errors.js";
import { ChallengeSubmissionId, GroupId } from "@mirai-app/domain";
import { CreateSubmissionInput, ReviewSubmissionInput, SubmissionResultType } from "./index.js";

// Import use cases
import {
  CreateSubmissionUseCase,
  ReviewSubmissionUseCase,
} from "@mirai-app/use-cases/challenge-submission";

builder.mutationFields((t) => ({
  createSubmission: t.field({
    type: SubmissionResultType,
    args: { input: t.arg({ type: CreateSubmissionInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAuth(context);

      const useCase = new CreateSubmissionUseCase();
      const effect = useCase.execute({
        tripId: args.input.tripId,
        challengeId: args.input.challengeId,
        userId: auth.userId,
        imageIds: args.input.imageIds ?? undefined,
        videoId: args.input.videoId ?? undefined,
        textContent: args.input.textContent ?? undefined,
        latitude: args.input.latitude ?? undefined,
        longitude: args.input.longitude ?? undefined,
      });

      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),
  reviewSubmission: t.field({
    type: SubmissionResultType,
    args: { input: t.arg({ type: ReviewSubmissionInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireModerator(context);

      const useCase = new ReviewSubmissionUseCase();
      
      // Validate status - only APPROVED or REJECTED allowed for review
      const status = args.input.status === "APPROVED" || args.input.status === "REJECTED"
        ? args.input.status
        : "REJECTED"; // Default to REJECTED if invalid
      
      const effect = useCase.execute({
        submissionId: args.input.submissionId,
        status,
        rejectionReason: args.input.rejectionReason ?? undefined,
        awardedPoints: args.input.awardedPoints ?? undefined,
        bonusPoints: args.input.bonusPoints ?? undefined,
        reviewerId: auth.userId,
      });

      return runEffect(context, effect)
        .then((result) => ({
          id: result.id,
          challengeId: result.challengeId,
          groupId: result.groupId,
          status: result.status,
          createdAt: result.reviewedAt,
        }))
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
    },
  }),
}));

export const challengeSubmissionMutations = {};