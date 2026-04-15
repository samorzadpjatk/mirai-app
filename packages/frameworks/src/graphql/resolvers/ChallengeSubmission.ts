import { builder } from "../builder";
import { ChallengeSubmission } from "@mirai-app/domain";
import type { GraphQLContext } from "../builder";
import { GraphQLError } from "graphql";

/**
 * ChallengeSubmission Resolvers
 *
 * GraphQL resolvers for ChallengeSubmission domain.
 */

// Enum for submission status
const SubmissionStatusEnum = builder.enumType("SubmissionStatus", {
  values: ["PENDING", "APPROVED", "REJECTED"] as const,
});

// ChallengeSubmission type
builder.node(ChallengeSubmission, {
  id: { resolve: (cs) => cs.id },
  name: "ChallengeSubmission",
  fields: (t) => ({
    id: t.exposeID("id"),
    challengeId: t.exposeString("challengeId"),
    groupId: t.exposeString("groupId"),
    imageIds: t.exposeStringList("imageIds"),
    videoId: t.exposeString("videoId", { nullable: true }),
    textContent: t.exposeString("textContent", { nullable: true }),
    latitude: t.exposeFloat("latitude", { nullable: true }),
    longitude: t.exposeFloat("longitude", { nullable: true }),
    status: t.field({
      type: SubmissionStatusEnum,
      resolve: (cs) => cs.status,
    }),
    reviewedById: t.exposeString("reviewedById", { nullable: true }),
    reviewedAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (cs) => cs.reviewedAt,
    }),
    rejectionReason: t.exposeString("rejectionReason", { nullable: true }),
    awardedPoints: t.exposeInt("awardedPoints"),
    bonusPoints: t.exposeInt("bonusPoints"),
    ranking: t.exposeInt("ranking", { nullable: true }),
    voteCount: t.exposeInt("voteCount"),
    voteScore: t.exposeFloat("voteScore"),
    createdAt: t.field({
      type: "DateTime",
      resolve: (cs) => cs.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (cs) => cs.updatedAt,
    }),
  }),
});

// Queries
builder.queryFields((t) => ({
  challengeSubmission: t.field({
    type: ChallengeSubmission,
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.challengeSubmissionController;
      const result = await controller.getById({ id: args.id.toString() });
      if (!result.success) return null;
      return result.data;
    },
  }),

  challengeSubmissions: t.field({
    type: [ChallengeSubmission],
    args: {
      challengeId: t.arg.string({ required: true }),
      groupId: t.arg.string(),
      status: t.arg({ type: SubmissionStatusEnum }),
      limit: t.arg.int({ defaultValue: 20 }),
      offset: t.arg.int({ defaultValue: 0 }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.challengeSubmissionController;
      const result = await controller.listByChallenge({
        challengeId: args.challengeId,
        limit: args.limit,
        offset: args.offset,
      });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      // Filter by status if provided
      if (args.status) {
        return result.data.filter((s: any) => s.status === args.status);
      }
      return result.data;
    },
  }),

  mySubmissions: t.field({
    type: [ChallengeSubmission],
    args: {
      groupId: t.arg.string({ required: true }),
    },
    resolve: async (_, _args, _ctx: GraphQLContext) => {
      // TODO: Implement getByGroupId in ChallengeSubmissionController
      return [];
    },
  }),
}));

// Mutations
builder.mutationFields((t) => ({
  createChallengeSubmission: t.field({
    type: ChallengeSubmission,
    args: {
      challengeId: t.arg.string({ required: true }),
      groupId: t.arg.string({ required: true }),
      imageIds: t.arg.stringList(),
      videoId: t.arg.string(),
      textContent: t.arg.string(),
      latitude: t.arg.float(),
      longitude: t.arg.float(),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.challengeSubmissionController;
      const result = await controller.create(args);
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "BAD_REQUEST" },
        });
      }
      return result.data;
    },
  }),

  reviewChallengeSubmission: t.field({
    type: ChallengeSubmission,
    args: {
      id: t.arg.id({ required: true }),
      status: t.arg({ type: SubmissionStatusEnum, required: true }),
      awardedPoints: t.arg.int(),
      rejectionReason: t.arg.string(),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.challengeSubmissionController;
      // Use update to change the status
      const result = await controller.update({
        id: args.id.toString(),
        status: args.status,
        awardedPoints: args.awardedPoints ?? undefined,
        rejectionReason: args.rejectionReason ?? undefined,
      });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "BAD_REQUEST" },
        });
      }
      return result.data;
    },
  }),

  deleteChallengeSubmission: t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.challengeSubmissionController;
      const result = await controller.delete({ id: args.id.toString() });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return true;
    },
  }),
}));
