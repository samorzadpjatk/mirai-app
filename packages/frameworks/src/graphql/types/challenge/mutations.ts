import { GraphQLError } from "graphql";
import { builder } from "../../builder.js";
import {
  ChallengeType,
  ChallengeSubmissionType,
  ChallengeVoteType,
  SubmissionStatusEnum,
  ChallengeStatusEnum,
  SubmissionTypeEnum,
} from "./types.js";
import type {
  ChallengeDTO,
  ChallengeSubmissionDTO,
  ChallengeVoteDTO,
  CreateChallengeInput,
  UpdateChallengeInput,
  CreateSubmissionInput,
  UpdateSubmissionInput,
  SubmitVoteInput,
  DeleteChallengeInput,
  DeleteChallengeOutput,
} from "@mirai-app/use-cases";
import type { GraphQLContext } from "../../context.js";
import type {
  ChallengeController,
  ChallengeSubmissionController,
  ChallengeVoteController,
} from "@mirai-app/adapters";

/**
 * Scoring Category Enum for input
 */
const ScoringCategoryEnum = builder.enumType("ScoringCategory", {
  description: "Scoring category for challenges",
  values: ["SPEED", "UNLIMITED", "JUDGED_STAFF", "PEER_VOTING"] as const,
});

/**
 * Create Challenge Input
 */
const CreateChallengeInput = builder.inputType("CreateChallengeInput", {
  description: "Input for creating a challenge",
  fields: (t) => ({
    tripId: t.field({ type: "ID", required: true }),
    name: t.field({ type: "String", required: true }),
    description: t.field({ type: "String" }),
    image: t.field({ type: "String" }),
    submissionType: t.field({
      type: SubmissionTypeEnum,
      required: true,
      description: "Type of submission accepted: PHOTO, VIDEO, or TEXT",
    }),
    scoringCategory: t.field({
      type: ScoringCategoryEnum,
      required: true,
      description:
        "Scoring category: SPEED, UNLIMITED, JUDGED_STAFF, or PEER_VOTING",
    }),
    basePoints: t.field({ type: "Int" }),
    firstPlacePoints: t.field({ type: "Int" }),
    secondPlacePoints: t.field({ type: "Int" }),
    thirdPlacePoints: t.field({ type: "Int" }),
    status: t.field({ type: ChallengeStatusEnum }),
    startTime: t.field({ type: "DateTime" }),
    endTime: t.field({ type: "DateTime" }),
    dailyStartTime: t.field({
      type: "String",
      description: "Time in HH:MM format",
    }),
    dailyEndTime: t.field({
      type: "String",
      description: "Time in HH:MM format",
    }),
    targetLatitude: t.field({ type: "Float" }),
    targetLongitude: t.field({ type: "Float" }),
    expectedValue: t.field({ type: "String" }),
    autoApprove: t.field({ type: "Boolean" }),
    isRecurring: t.field({ type: "Boolean" }),
  }),
});

/**
 * Update Challenge Input
 */
const UpdateChallengeInput = builder.inputType("UpdateChallengeInput", {
  description: "Input for updating a challenge",
  fields: (t) => ({
    name: t.field({ type: "String" }),
    description: t.field({ type: "String" }),
    image: t.field({ type: "String" }),
    basePoints: t.field({ type: "Int" }),
    firstPlacePoints: t.field({ type: "Int" }),
    secondPlacePoints: t.field({ type: "Int" }),
    thirdPlacePoints: t.field({ type: "Int" }),
    startTime: t.field({ type: "DateTime" }),
    endTime: t.field({ type: "DateTime" }),
    dailyStartTime: t.field({
      type: "String",
      description: "Time in HH:MM format",
    }),
    dailyEndTime: t.field({
      type: "String",
      description: "Time in HH:MM format",
    }),
    targetLatitude: t.field({ type: "Float" }),
    targetLongitude: t.field({ type: "Float" }),
    expectedValue: t.field({ type: "String" }),
    autoApprove: t.field({ type: "Boolean" }),
  }),
});

/**
 * Create Challenge Submission Input
 */
const CreateChallengeSubmissionInput = builder.inputType(
  "CreateChallengeSubmissionInput",
  {
    description: "Input for creating a challenge submission",
    fields: (t) => ({
      challengeId: t.field({ type: "ID", required: true }),
      groupId: t.field({ type: "ID" }),
      content: t.field({ type: "String" }),
      mediaUrls: t.field({ type: ["String"] }),
    }),
  },
);

/**
 * Approve Challenge Submission Input
 */
const ApproveChallengeSubmissionInput = builder.inputType(
  "ApproveChallengeSubmissionInput",
  {
    description: "Input for approving a challenge submission",
    fields: (t) => ({
      submissionId: t.field({ type: "ID", required: true }),
      score: t.field({ type: "Int" }),
      notes: t.field({ type: "String" }),
    }),
  },
);

/**
 * Reject Challenge Submission Input
 */
const RejectChallengeSubmissionInput = builder.inputType(
  "RejectChallengeSubmissionInput",
  {
    description: "Input for rejecting a challenge submission",
    fields: (t) => ({
      submissionId: t.field({ type: "ID", required: true }),
      reason: t.field({ type: "String", required: true }),
    }),
  },
);

/**
 * Create Challenge Vote Input
 */
const CreateChallengeVoteInput = builder.inputType("CreateChallengeVoteInput", {
  description: "Input for creating a challenge vote",
  fields: (t) => ({
    challengeId: t.field({ type: "ID", required: true }),
    submissionId: t.field({ type: "ID", required: true }),
    position: t.field({
      type: "Int",
      required: true,
      description: "Vote position (1, 2, 3, etc.)",
    }),
    points: t.field({ type: "Int", description: "Points to award" }),
  }),
});

/**
 * Extended GraphQL Context with challenge controllers
 */
interface ChallengeGraphQLContext extends GraphQLContext {
  controllers: {
    challengeController: ChallengeController;
    challengeSubmissionController: ChallengeSubmissionController;
    challengeVoteController: ChallengeVoteController;
  };
}

/**
 * Challenge Mutations
 */
builder.mutationFields((t) => ({
  /**
   * Create a new challenge
   */
  createChallenge: t.field({
    type: ChallengeType,
    args: {
      input: t.arg({ type: CreateChallengeInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          tripId: string;
          name: string;
          description?: string | null;
          image?: string | null;
          submissionType: string;
          scoringCategory: string;
          basePoints?: number | null;
          firstPlacePoints?: number | null;
          secondPlacePoints?: number | null;
          thirdPlacePoints?: number | null;
          status?: string | null;
          startTime?: Date | null;
          endTime?: Date | null;
          dailyStartTime?: string | null;
          dailyEndTime?: string | null;
          targetLatitude?: number | null;
          targetLongitude?: number | null;
          expectedValue?: string | null;
          autoApprove?: boolean | null;
          isRecurring?: boolean | null;
        };
      },
      ctx: ChallengeGraphQLContext,
    ) => {
      const controller = ctx.controllers.challengeController;
      const result = await controller.create(args.input);

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Update an existing challenge
   */
  updateChallenge: t.field({
    type: ChallengeType,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateChallengeInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        id: string;
        input: {
          name?: string | null;
          description?: string | null;
          image?: string | null;
          basePoints?: number | null;
          firstPlacePoints?: number | null;
          secondPlacePoints?: number | null;
          thirdPlacePoints?: number | null;
          startTime?: Date | null;
          endTime?: Date | null;
          dailyStartTime?: string | null;
          dailyEndTime?: string | null;
          targetLatitude?: number | null;
          targetLongitude?: number | null;
          expectedValue?: string | null;
          autoApprove?: boolean | null;
        };
      },
      ctx: ChallengeGraphQLContext,
    ) => {
      const controller = ctx.controllers.challengeController;
      const result = await controller.update({
        challengeId: args.id,
        ...args.input,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Delete a challenge
   */
  deleteChallenge: t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (
      _parent,
      args: {
        id: string;
      },
      ctx: ChallengeGraphQLContext,
    ) => {
      const controller = ctx.controllers.challengeController;
      const result = await controller.delete({ challengeId: args.id });

      if (!result.success) {
        throw new GraphQLError(result.error || "Failed to delete challenge", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return true;
    },
  }),

  /**
   * Create a challenge submission
   */
  createChallengeSubmission: t.field({
    type: ChallengeSubmissionType,
    args: {
      input: t.arg({ type: CreateChallengeSubmissionInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          challengeId: string;
          groupId?: string | null;
          content?: string | null;
          mediaUrls?: string[] | null;
        };
      },
      ctx: ChallengeGraphQLContext,
    ) => {
      if (!ctx.authContext) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.challengeSubmissionController;
      const result = await controller.create({
        ...args.input,
        userId: ctx.authContext.user.id,
      });

      if (!result.success) {
        throw new GraphQLError(result.error || "Failed to create submission", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Approve a challenge submission (moderator action)
   */
  approveChallengeSubmission: t.field({
    type: ChallengeSubmissionType,
    args: {
      input: t.arg({ type: ApproveChallengeSubmissionInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          submissionId: string;
          score?: number | null;
          notes?: string | null;
        };
      },
      ctx: ChallengeGraphQLContext,
    ) => {
      if (!ctx.authContext) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.challengeSubmissionController;
      const result = await controller.update({
        submissionId: args.input.submissionId,
        reviewAction: "APPROVE",
        reviewedById: ctx.authContext.user.id,
        score: args.input.score ?? undefined,
        reviewNotes: args.input.notes ?? undefined,
      });

      if (!result.success) {
        throw new GraphQLError(result.error || "Failed to approve submission", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Reject a challenge submission (moderator action)
   */
  rejectChallengeSubmission: t.field({
    type: ChallengeSubmissionType,
    args: {
      input: t.arg({ type: RejectChallengeSubmissionInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          submissionId: string;
          reason: string;
        };
      },
      ctx: ChallengeGraphQLContext,
    ) => {
      if (!ctx.authContext) {
        throw new Error("Authentication required");
      }

      const controller = ctx.controllers.challengeSubmissionController;
      const result = await controller.update({
        submissionId: args.input.submissionId,
        reviewAction: "REJECT",
        reviewedById: ctx.authContext.user.id,
        reviewNotes: args.input.reason,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to reject submission");
      }

      return result.data;
    },
  }),

  /**
   * Create a vote on a challenge submission
   */
  createChallengeVote: t.field({
    type: ChallengeVoteType,
    args: {
      input: t.arg({ type: CreateChallengeVoteInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          challengeId: string;
          submissionId: string;
          position: number;
          points?: number | null;
        };
      },
      ctx: ChallengeGraphQLContext,
    ) => {
      if (!ctx.authContext) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.challengeVoteController;
      const result = await controller.submitVote({
        challengeId: args.input.challengeId,
        submissionId: args.input.submissionId,
        voterId: ctx.authContext.user.id,
        position: args.input.position,
        points: args.input.points ?? undefined,
      });

      if (!result.success) {
        throw new GraphQLError(result.error || "Failed to submit vote", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data as ChallengeVoteDTO;
    },
  }),
}));

export {};
