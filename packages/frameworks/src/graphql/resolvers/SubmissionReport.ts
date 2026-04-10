import { builder } from "../builder.js";
import { SubmissionReport } from "../../../domain/src/entities/SubmissionReport.js";
import type { DIContext } from "../../di/src/index.js";
import { TRPCError } from "@trpc/server";

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
      resolve: async (sr, _, ctx: DIContext) => {
        const controller = ctx.container.resolve("userController");
        const result = await controller.getById(
          { id: sr.reporterId },
          ctx.container,
        );
        if (result.kind === "err") return null;
        return result.value;
      },
    }),
    submission: t.field({
      type: "ChallengeSubmission",
      nullable: true,
      resolve: async (sr, _, ctx: DIContext) => {
        const controller = ctx.container.resolve(
          "challengeSubmissionController",
        );
        const result = await controller.getById(
          { id: sr.submissionId },
          ctx.container,
        );
        if (result.kind === "err") return null;
        return result.value;
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
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve("submissionReportController");
      const result = await controller.getById(
        { id: args.id.toString() },
        ctx.container,
      );
      if (result.kind === "err") return null;
      return result.value;
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
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve("submissionReportController");
      const result = await controller.getReports(
        {
          submissionId: args.submissionId ?? undefined,
          reporterId: args.reporterId ?? undefined,
          reason: args.reason ?? undefined,
          limit: args.limit,
          offset: args.offset,
        },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error.message,
        });
      }
      return result.value;
    },
  }),

  reportsBySubmission: t.field({
    type: [SubmissionReport],
    args: {
      submissionId: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve("submissionReportController");
      const result = await controller.getBySubmissionId(
        { submissionId: args.submissionId },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error.message,
        });
      }
      return result.value;
    },
  }),

  myReports: t.field({
    type: [SubmissionReport],
    args: {
      limit: t.arg.int({ defaultValue: 20 }),
      offset: t.arg.int({ defaultValue: 0 }),
    },
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve("submissionReportController");
      const result = await controller.getByReporterId(
        { limit: args.limit, offset: args.offset },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error.message,
        });
      }
      return result.value;
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
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve("submissionReportController");
      const result = await controller.create(args, ctx.container);
      if (result.kind === "err") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error.message,
        });
      }
      return result.value;
    },
  }),

  deleteSubmissionReport: t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve("submissionReportController");
      const result = await controller.delete(
        { id: args.id.toString() },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error.message,
        });
      }
      return result.value;
    },
  }),
}));
