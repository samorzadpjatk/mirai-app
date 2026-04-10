import { builder } from "../builder.js";
import { ChallengeSubmission } from "../../../domain/src/entities/ChallengeSubmission.js";
import type { GraphQLContext } from "../builder.js";
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
      const controller = ctx.container.resolve("challengeSubmissionController");
      const result = await controller.getById(
        { id: args.id.toString() },
        ctx.container,
      );
      if (result.kind === "err") return null;
      return result.value;
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
      const controller = ctx.container.resolve("challengeSubmissionController");
      const result = await controller.getByChallengeId(
        {
          challengeId: args.challengeId,
          groupId: args.groupId ?? undefined,
          status: args.status ?? undefined,
          limit: args.limit,
          offset: args.offset,
        },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
      }
      return result.value;
    },
  }),

  mySubmissions: t.field({
    type: [ChallengeSubmission],
    args: {
      groupId: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.container.resolve("challengeSubmissionController");
      const result = await controller.getByGroupId(
        { groupId: args.groupId },
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
      const controller = ctx.container.resolve("challengeSubmissionController");
      const result = await controller.create(args, ctx.container);
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "BAD_REQUEST" } });
      }
      return result.value;
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
      const controller = ctx.container.resolve("challengeSubmissionController");
      const result = await controller.review(
        {
          id: args.id.toString(),
          status: args.status,
          awardedPoints: args.awardedPoints ?? undefined,
          rejectionReason: args.rejectionReason ?? undefined,
        },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "BAD_REQUEST" } });
      }
      return result.value;
    },
  }),

  deleteChallengeSubmission: t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.container.resolve("challengeSubmissionController");
      const result = await controller.delete(
        { id: args.id.toString() },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
      }
      return result.value;
    },
  }),
}));
