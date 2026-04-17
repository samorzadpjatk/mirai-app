import { builder } from "../../builder.js";
import {
  SubmissionReportType,
  SubmissionReportConnectionType,
  buildSubmissionReportConnection,
} from "./types.js";
import { decodeCursorWithDate, clampFirst } from "../../utils/connections.js";
import type { SubmissionReportDTO } from "@mirai-app/use-cases";
import { GraphQLError } from "graphql";

/**
 * Input type for creating a submission report
 */
const CreateSubmissionReportInput = builder.inputType(
  "CreateSubmissionReportInput",
  {
    description: "Input for creating a submission report",
    fields: (t) => ({
      submissionId: t.field({
        type: "ID",
        required: true,
        description: "ID of the submission being reported",
      }),
      reason: t.field({
        type: "String",
        required: true,
        description: "Reason for the report",
      }),
      details: t.field({
        type: "String",
        required: false,
        description: "Additional details about the report",
      }),
    }),
  },
);

/**
 * SubmissionReport Mutations
 */
builder.mutationFields((t) => ({
  /**
   * Create a submission report
   */
  createSubmissionReport: t.field({
    type: SubmissionReportType,
    args: {
      input: t.arg({
        type: CreateSubmissionReportInput,
        required: true,
      }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          submissionId: string;
          reason: string;
          details?: string | null;
        };
      },
      ctx: {
        authContext?: { userId: string };
        controllers: {
          submissionReportController: {
            create: (
              input: unknown,
              reporterId: string,
            ) => Promise<
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
                  };
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
      const result = await controller.create(
        {
          submissionId: args.input.submissionId,
          reason: args.input.reason,
          details: args.input.details,
        },
        ctx.authContext.userId,
      );

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      // Map to DTO format
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

  /**
   * Delete a submission report
   */
  deleteSubmissionReport: t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({
        required: true,
        description: "ID of the submission report to delete",
      }),
    },
    resolve: async (
      _parent,
      args: { id: string },
      ctx: {
        authContext?: { userId: string };
        controllers: {
          submissionReportController: {
            delete: (input: {
              id: string;
            }) => Promise<
              | { success: true; data: { deleted: boolean } }
              | { success: false; error: string }
            >;
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
      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.submissionReportController;

      // Get the report to check ownership
      const reportResult = await controller.getById({ id: args.id });
      if (!reportResult.success) {
        throw new GraphQLError(reportResult.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      if (!reportResult.data) {
        throw new GraphQLError("Report not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      // Only allow deletion by the reporter or an admin
      if (reportResult.data.reporterId !== ctx.authContext.userId) {
        throw new GraphQLError("Not authorized to delete this report", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const result = await controller.delete({ id: args.id });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data.deleted;
    },
  }),
}));
