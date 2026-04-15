import { builder } from "../builder.js";
import { SubmissionReport } from "../../../domain/src/entities/SubmissionReport.js";
import type { GraphQLContext } from "../builder.js";
import { GraphQLError } from "graphql";

/**
 * SubmissionReport Resolvers
 *
 * GraphQL resolvers for SubmissionReport domain.
 */

// Enum for report reason
const ReportReasonEnum = builder.enumType("ReportReason", {
  values: [
    "INAPPROPRIATE_CONTENT",
    "SPAM",
    "HARASSMENT",
    "CHEATING",
    "OTHER",
  ] as const,
});

// SubmissionReport type
builder.node(SubmissionReport, {
  id: { resolve: (sr) => sr.id },
  name: "SubmissionReport",
  fields: (t) => ({
    id: t.exposeID("id"),
    submissionId: t.exposeString("submissionId"),
    reporterId: t.exposeString("reporterId"),
    reason: t.field({
      type: ReportReasonEnum,
      resolve: (sr) =>
        sr.reason as
          | "INAPPROPRIATE_CONTENT"
          | "SPAM"
          | "HARASSMENT"
          | "CHEATING"
          | "OTHER",
    }),
    details: t.exposeString("details", { nullable: true }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (sr) => sr.createdAt,
    }),
    reporter: t.field({
      type: "User",
      nullable: true,
      resolve: async (sr, _, ctx: GraphQLContext) => {
        const controller = ctx.controllers.userController;
        const result = await controller.getById({ id: sr.reporterId });
        if (!result.success) return null;
        return result.data;
      },
    }),
    submission: t.field({
      type: "ChallengeSubmission",
      nullable: true,
      resolve: async (sr, _, ctx: GraphQLContext) => {
        const controller = ctx.controllers.challengeSubmissionController;
        const result = await controller.getById({ id: sr.submissionId });
        if (!result.success) return null;
        return result.data;
      },
    }),
  }),
});

// Queries
builder.queryFields((t) => ({
  submissionReport: t.field({
    type: SubmissionReport,
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, _args, _ctx: GraphQLContext) => {
      // TODO: Implement getById in SubmissionReportController
      return null;
    },
  }),

  submissionReports: t.field({
    type: [SubmissionReport],
    args: {
      submissionId: t.arg.string(),
      reporterId: t.arg.string(),
      reason: t.arg({ type: ReportReasonEnum }),
      limit: t.arg.int({ defaultValue: 20 }),
      offset: t.arg.int({ defaultValue: 0 }),
    },
    resolve: async (_, _args, _ctx: GraphQLContext) => {
      // TODO: Implement getReports in SubmissionReportController
      return [];
    },
  }),

  reportsBySubmission: t.field({
    type: [SubmissionReport],
    args: {
      submissionId: t.arg.string({ required: true }),
    },
    resolve: async (_, _args, _ctx: GraphQLContext) => {
      // TODO: Implement getBySubmissionId in SubmissionReportController
      return [];
    },
  }),

  myReports: t.field({
    type: [SubmissionReport],
    args: {
      limit: t.arg.int({ defaultValue: 20 }),
      offset: t.arg.int({ defaultValue: 0 }),
    },
    resolve: async (_, _args, _ctx: GraphQLContext) => {
      // TODO: Implement getByReporterId in SubmissionReportController
      return [];
    },
  }),
}));

// Mutations
builder.mutationFields((t) => ({
  createSubmissionReport: t.field({
    type: SubmissionReport,
    args: {
      submissionId: t.arg.string({ required: true }),
      reason: t.arg({ type: ReportReasonEnum, required: true }),
      details: t.arg.string(),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.submissionReportController;
      const result = await controller.create(args);
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "BAD_REQUEST" },
        });
      }
      return result.data;
    },
  }),

  deleteSubmissionReport: t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, _args, _ctx: GraphQLContext) => {
      // TODO: Implement delete in SubmissionReportController
      return true;
    },
  }),
}));
