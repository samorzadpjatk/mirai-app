import { builder } from "../../builder.js";
import {
  SubmissionReportConnectionType,
  SubmissionReportType,
  buildSubmissionReportConnection,
} from "./types.js";
import { decodeCursorWithDate, clampFirst } from "../../utils/connections.js";
import type { SubmissionReportDTO } from "@mirai-app/use-cases";
import { GraphQLError } from "graphql";

/**
 * SubmissionReport Queries
 */
builder.queryFields((t) => ({
  /**
   * Get submission reports with optional filters
   */
  submissionReports: t.field({
    type: SubmissionReportConnectionType,
    args: {
      submissionId: t.arg.id({
        description: "Filter by submission ID",
        required: false,
      }),
      reporterId: t.arg.id({
        description: "Filter by reporter ID",
        required: false,
      }),
      status: t.arg.string({
        description: "Filter by report status",
        required: false,
      }),
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        submissionId?: string | null;
        reporterId?: string | null;
        status?: string | null;
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        authContext?: { userId: string; role: string };
        controllers: {
          submissionReportController: {
            getReports: (input: {
              submissionId?: string;
              reporterId?: string;
              reason?: string;
              limit?: number;
              offset?: number;
            }) => Promise<
              | {
                  success: true;
                  data: {
                    reports: Array<{
                      id: string;
                      submissionId: string;
                      reporterId: string;
                      reason: string;
                      reasonDisplay: string;
                      details: string | null;
                      createdAt: Date;
                    }>;
                    total: number;
                  };
                }
              | { success: false; error: string }
            >;
          };
        };
      },
    ) => {
      // Check if user is admin or moderator
      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.submissionReportController;
      const first = clampFirst(args.first ?? null);
      const offset = args.after
        ? decodeCursorWithDate(args.after).date.getTime()
        : 0;

      const result = await controller.getReports({
        submissionId: args.submissionId ?? undefined,
        reporterId: args.reporterId ?? undefined,
        reason: undefined, // Reason filter handled separately
        limit: first,
        offset,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      // Map to DTO format
      const reports: SubmissionReportDTO[] = result.data.reports.map((r) => ({
        id: r.id,
        submissionId: r.submissionId,
        reporterId: r.reporterId,
        reason: r.reason,
        description: r.details,
        status: "PENDING", // Default status
        reviewedById: null,
        reviewedAt: null,
        createdAt: r.createdAt,
        updatedAt: r.createdAt,
      }));

      const hasMore = reports.length === first;

      return buildSubmissionReportConnection(reports, hasMore, !!args.after);
    },
  }),

  /**
   * Get my submitted reports
   */
  mySubmissionReports: t.field({
    type: SubmissionReportConnectionType,
    args: {
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        authContext?: { userId: string };
        controllers: {
          submissionReportController: {
            getByReporterId: (input: {
              reporterId: string;
              limit?: number;
              offset?: number;
            }) => Promise<
              | {
                  success: true;
                  data: Array<{
                    id: string;
                    submissionId: string;
                    reporterId: string;
                    reason: string;
                    reasonDisplay: string;
                    details: string | null;
                    createdAt: Date;
                  }>;
                }
              | { success: false; error: string }
            >;
          };
        };
      },
    ) => {
      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.submissionReportController;
      const first = clampFirst(args.first ?? null);
      const offset = args.after
        ? decodeCursorWithDate(args.after).date.getTime()
        : 0;

      const result = await controller.getByReporterId({
        reporterId: ctx.authContext.userId,
        limit: first,
        offset,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      // Map to DTO format
      const reports: SubmissionReportDTO[] = result.data.map((r) => ({
        id: r.id,
        submissionId: r.submissionId,
        reporterId: r.reporterId,
        reason: r.reason,
        description: r.details,
        status: "PENDING",
        reviewedById: null,
        reviewedAt: null,
        createdAt: r.createdAt,
        updatedAt: r.createdAt,
      }));

      const hasMore = reports.length === first;

      return buildSubmissionReportConnection(reports, hasMore, !!args.after);
    },
  }),

  /**
   * Get a single submission report by ID
   */
  submissionReport: t.field({
    type: SubmissionReportType,
    nullable: true,
    args: {
      id: t.arg.id({
        required: true,
        description: "ID of the submission report to fetch",
      }),
    },
    resolve: async (
      _parent,
      args: { id: string },
      ctx: {
        controllers: {
          submissionReportController: {
            getById: (input: { id: string }) => Promise<
              | {
                  success: true;
                  data: {
                    id: string;
                    submissionId: string;
                    reporterId: string;
                    reason: string;
                    reasonDisplay: string;
                    details: string | null;
                    createdAt: Date;
                  } | null;
                }
              | { success: false; error: string }
            >;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.submissionReportController;
      const result = await controller.getById({ id: args.id });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      if (!result.data) {
        return null;
      }

      // Map to DTO
      return {
        id: result.data.id,
        submissionId: result.data.submissionId,
        reporterId: result.data.reporterId,
        reason: result.data.reason,
        description: result.data.details,
        status: "PENDING",
        reviewedById: null,
        reviewedAt: null,
        createdAt: result.data.createdAt,
        updatedAt: result.data.createdAt,
      };
    },
  }),
}));
