// =============================================================================
// Challenge Mutations - Effect DI Pattern
// =============================================================================

import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAdmin, runEffect } from "../../context.js";
import { mapErrorToGraphQL } from "../../errors.js";
import { ChallengeId, TripId } from "@mirai-app/domain";
import { CreateChallengeInput, UpdateChallengeInput, DeleteChallengeInput, ChallengeResultType, ForceCloseVotingResultType } from "./types.js";

// Import use cases
import {
  CreateChallengeUseCase,
  UpdateChallengeUseCase,
  DeleteChallengeUseCase,
  ForceCloseVotingUseCase,
} from "@mirai-app/use-cases/challenge";

builder.mutationFields((t) => ({
  createChallenge: t.field({
    type: ChallengeResultType,
    args: { input: t.arg({ type: CreateChallengeInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);

      const useCase = new CreateChallengeUseCase();
      
      // Validate submission type - MULTI_IMAGE not supported by use case
      const submissionType = args.input.submissionType === "MULTI_IMAGE" 
        ? "IMAGE" 
        : args.input.submissionType;
      
      // Validate initial status - only HIDDEN or VISIBLE allowed for creation
      const status = args.input.status === "HIDDEN" || args.input.status === "VISIBLE" 
        ? args.input.status 
        : undefined;
      
      const effect = useCase.execute({
        tripId: args.input.tripId,
        name: args.input.name,
        description: args.input.description ?? undefined,
        qrCodeValue: args.input.qrCodeValue ?? undefined,
        textExpectedPhrase: args.input.textExpectedPhrase ?? undefined,
        image: args.input.image ?? undefined,
        submissionType,
        scoringCategory: args.input.scoringCategory,
        isRecurring: args.input.isRecurring ?? undefined,
        recurringDays: args.input.recurringDays ?? undefined,
        dailyStartTime: args.input.dailyStartTime ?? undefined,
        dailyEndTime: args.input.dailyEndTime ?? undefined,
        basePoints: args.input.basePoints ?? undefined,
        firstPlacePoints: args.input.firstPlacePoints ?? undefined,
        secondPlacePoints: args.input.secondPlacePoints ?? undefined,
        thirdPlacePoints: args.input.thirdPlacePoints ?? undefined,
        status,
        startTime: args.input.startTime ?? undefined,
        endTime: args.input.endTime ?? undefined,
        votingDurationHours: args.input.votingDurationHours ?? undefined,
        votingStartTime: args.input.votingStartTime ?? undefined,
        votingEndTime: args.input.votingEndTime ?? undefined,
        targetLatitude: args.input.targetLatitude ?? undefined,
        targetLongitude: args.input.targetLongitude ?? undefined,
        autoApprove: args.input.autoApprove ?? undefined,
      });

      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),
  updateChallenge: t.field({
    type: ChallengeResultType,
    args: { input: t.arg({ type: UpdateChallengeInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);

      const useCase = new UpdateChallengeUseCase();
      
      // Validate submission type - MULTI_IMAGE not supported by use case
      const submissionType = args.input.submissionType === "MULTI_IMAGE" 
        ? "IMAGE" 
        : args.input.submissionType ?? undefined;
      
      const effect = useCase.execute({
        challengeId: args.input.id,
        tripId: args.input.tripId,
        name: args.input.name ?? undefined,
        description: args.input.description ?? undefined,
        qrCodeValue: args.input.qrCodeValue ?? undefined,
        textExpectedPhrase: args.input.textExpectedPhrase ?? undefined,
        image: args.input.image ?? undefined,
        submissionType,
        scoringCategory: args.input.scoringCategory ?? undefined,
        isRecurring: args.input.isRecurring ?? undefined,
        recurringDays: args.input.recurringDays ?? undefined,
        dailyStartTime: args.input.dailyStartTime ?? undefined,
        dailyEndTime: args.input.dailyEndTime ?? undefined,
        basePoints: args.input.basePoints ?? undefined,
        firstPlacePoints: args.input.firstPlacePoints ?? undefined,
        secondPlacePoints: args.input.secondPlacePoints ?? undefined,
        thirdPlacePoints: args.input.thirdPlacePoints ?? undefined,
        status: args.input.status ?? undefined,
        startTime: args.input.startTime ?? undefined,
        endTime: args.input.endTime ?? undefined,
        votingDurationHours: args.input.votingDurationHours ?? undefined,
        votingStartTime: args.input.votingStartTime ?? undefined,
        votingEndTime: args.input.votingEndTime ?? undefined,
        targetLatitude: args.input.targetLatitude ?? undefined,
        targetLongitude: args.input.targetLongitude ?? undefined,
        autoApprove: args.input.autoApprove ?? undefined,
      });

      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),
  deleteChallenge: t.field({
    type: ChallengeResultType,
    args: { input: t.arg({ type: DeleteChallengeInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);

      const useCase = new DeleteChallengeUseCase();
      const effect = useCase.execute({
        challengeId: args.input.id,
        tripId: args.input.tripId,
      });

      return runEffect(context, effect)
        .then(() => ({
          id: ChallengeId.unsafeCreate(args.input.id),
          tripId: TripId.unsafeCreate(args.input.tripId),
          name: "Deleted",
          status: "CANCELLED" as const,
          isRecurring: false,
        }))
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
    },
  }),
  forceCloseVoting: t.field({
    type: ForceCloseVotingResultType,
    args: { id: t.arg.string({ required: true }), tripId: t.arg.string({ required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAdmin(context);

      const useCase = new ForceCloseVotingUseCase();
      const effect = useCase.execute({
        challengeId: args.id,
        tripId: args.tripId,
        adminId: auth.userId,
      });

      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),
}));

export const challengeMutations = {};