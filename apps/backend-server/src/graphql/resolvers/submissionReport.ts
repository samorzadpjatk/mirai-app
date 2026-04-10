/**
 * SubmissionReport GraphQL Resolvers
 *
 * Resolvers for SubmissionReport domain queries and mutations.
 * Maps use case outputs to GraphQL responses with proper error handling.
 *
 * ## Queries
 *
 * - submissionReports(submissionId: ID!): SubmissionReportListResult
 *
 * ## Mutations
 *
 * - createSubmissionReport(input: CreateReportInput!): SubmissionReportCreateResult
 *
 * @module SubmissionReport/resolvers
 */

import { builder } from "../builder";
import { SubmissionReportController } from "@mirai-app/adapters";
import type {
  CreateReportOutput,
  GetReportsOutput,
} from "@mirai-app/use-cases";
import { requireAuth, getCurrentUserId } from "../utils/auth-helpers";
import {
  SubmissionReportType,
  SubmissionReportListResultType,
  SubmissionReportCreateResultType,
  CreateReportInput,
} from "../types/submissionReport";

// =============================================================================
// Query Fields
// =============================================================================

/**
 * Query: submissionReports(submissionId: ID!) - Get reports for a submission
 *
 * Public access. Returns list of reports filed against a submission.
 */
builder.queryField("submissionReports", (t) =>
  t.field({
    description: "Get all reports filed against a specific submission",
    type: SubmissionReportListResultType,
    authScopes: { public: true },
    args: {
      submissionId: t.arg.id({
        description: "Submission ID to fetch reports for",
        required: true,
      }),
    },
    resolve: async (_root, args, context): Promise<GetReportsOutput> => {
      const controller = context.container.resolve<SubmissionReportController>(
        "submissionReportController",
      );

      const result = await controller.getBySubmission({
        submissionId: args.submissionId.toString(),
      });

      if (result.success === false) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),
);

// =============================================================================
// Mutation Fields
// =============================================================================

/**
 * Mutation: createSubmissionReport - Create a new report
 *
 * Requires authentication. Creates a report against a submission.
 * Returns error if user has already reported this submission.
 */
builder.mutationField("createSubmissionReport", (t) =>
  t.field({
    description: "Create a new submission report",
    type: SubmissionReportCreateResultType,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({
        type: CreateReportInput,
        description: "Report creation input",
        required: true,
      }),
    },
    resolve: async (_root, args, context): Promise<CreateReportOutput> => {
      // Require authentication to get reporter ID
      const reporterId = await getCurrentUserId(context);

      const controller = context.container.resolve<SubmissionReportController>(
        "submissionReportController",
      );

      const result = await controller.create(
        {
          submissionId: args.input.submissionId.toString(),
          reason: args.input.reason,
          details: args.input.details ?? undefined,
        },
        reporterId,
      );

      if (result.success === false) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),
);

// =============================================================================
// Export
// =============================================================================

// Resolvers are registered automatically by importing this file
export {};
