import { builder } from "../builder";
import { ChallengeType, CreateChallengeInput } from "../types/Challenge";
import {
  GetChallengeUseCase,
  CreateChallengeUseCase,
  type GetChallengeInput,
  type CreateChallengeInput as CreateChallengeUseCaseInput,
} from "@mirai-app/use-cases";
import {
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";

/**
 * Challenge Queries
 */
builder.queryFields((t) => ({
  /**
   * Get a challenge by ID
   */
  challenge: t.field({
    type: ChallengeType,
    nullable: true,
    description: "Get a challenge by ID",
    args: {
      id: t.arg.id({ required: true, description: "Challenge ID" }),
    },
    authScopes: { authenticated: true },
    resolve: async (_, args, context) => {
      const useCase = context.container.resolve<GetChallengeUseCase>(
        "getChallengeUseCase",
      );
      const result = await useCase.execute({ challengeId: args.id });

      if (result.kind === "err") {
        throw new Error(result.error);
      }

      return result.value;
    },
  }),

  /**
   * List challenges for a trip
   */
  challenges: t.field({
    type: [ChallengeType],
    description: "List challenges for a trip",
    args: {
      tripId: t.arg.id({ required: true, description: "Trip ID" }),
    },
    authScopes: { authenticated: true },
    resolve: async (_, args, context) => {
      // This would need a ListChallengesUseCase
      // For now, return empty array as example
      return [];
    },
  }),
}));

/**
 * Challenge Mutations
 */
builder.mutationFields((t) => ({
  /**
   * Create a new challenge
   */
  createChallenge: t.field({
    type: ChallengeType,
    description: "Create a new challenge",
    args: {
      input: t.arg({ type: CreateChallengeInput, required: true }),
    },
    authScopes: { admin: true },
    resolve: async (_, args, context) => {
      const useCase = context.container.resolve<CreateChallengeUseCase>(
        "createChallengeUseCase",
      );

      const statusMap: Record<string, ChallengeStatus> = {
        HIDDEN: ChallengeStatus.HIDDEN,
        VISIBLE: ChallengeStatus.VISIBLE,
        ACTIVE: ChallengeStatus.ACTIVE,
        VOTING_PHASE: ChallengeStatus.VOTING_PHASE,
        COMPLETED: ChallengeStatus.COMPLETED,
        CANCELLED: ChallengeStatus.CANCELLED,
      };

      const submissionTypeMap: Record<string, SubmissionType> = {
        IMAGE: SubmissionType.IMAGE,
        MULTI_IMAGE: SubmissionType.MULTI_IMAGE,
        VIDEO: SubmissionType.VIDEO,
        TEXT: SubmissionType.TEXT,
        IMAGE_LOCATION: SubmissionType.IMAGE_LOCATION,
        LOCATION: SubmissionType.LOCATION,
        QR_CODE: SubmissionType.QR_CODE,
      };

      const scoringCategoryMap: Record<string, ScoringCategory> = {
        SPEED: ScoringCategory.SPEED,
        UNLIMITED: ScoringCategory.UNLIMITED,
        JUDGED_STAFF: ScoringCategory.JUDGED_STAFF,
        PEER_VOTING: ScoringCategory.PEER_VOTING,
      };

      const result = await useCase.execute({
        tripId: args.input.tripId,
        name: args.input.name,
        description: args.input.description ?? undefined,
        submissionType:
          submissionTypeMap[args.input.submissionType] ?? SubmissionType.IMAGE,
        scoringCategory:
          scoringCategoryMap[args.input.scoringCategory] ??
          ScoringCategory.SPEED,
        points: args.input.points ?? undefined,
        isRecurring: args.input.isRecurring ?? false,
        startDate: args.input.startDate ?? undefined,
        endDate: args.input.endDate ?? undefined,
        status: ChallengeStatus.HIDDEN,
      });

      if (result.kind === "err") {
        throw new Error(result.error);
      }

      return result.value;
    },
  }),
}));
