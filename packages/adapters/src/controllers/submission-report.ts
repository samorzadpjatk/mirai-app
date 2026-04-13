import { z } from "zod";
import { Effect } from "effect";
import type { SubmissionReportRepository } from "@mirai-app/use-cases";
import type { SubmissionReport } from "@mirai-app/domain";
import {
  createReportUseCase,
  getReportsUseCase,
  SubmissionReportRepositoryTag,
  type CreateReportInput,
  type GetReportsInput,
} from "@mirai-app/use-cases";
import { effectToControllerResult } from "../utils/controller-helpers";

/**
 * Input validation schemas for submission report controller
 */
const schemas = {
  create: z.object({
    tripId: z.string().uuid("Invalid trip ID format"),
    submissionId: z.string().min(1, "Submission ID is required"),
    reason: z.string().min(1, "Reason is required").max(100),
    details: z
      .string()
      .max(2000, "Details must be at most 2000 characters")
      .optional(),
  }),

  getBySubmission: z.object({
    submissionId: z.string().min(1, "Submission ID is required"),
  }),
};

/**
 * SubmissionReportController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 */
export class SubmissionReportController {
  constructor(private reportRepository: SubmissionReportRepository) {}

  /**
   * Create a new report
   */
  async create(
    input: unknown,
    reporterId: string,
  ): Promise<
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
  > {
    const parsed = schemas.create.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = createReportUseCase({
      submissionId: parsed.data.submissionId,
      reporterId,
      reason: parsed.data.reason,
      details: parsed.data.details,
    }).pipe(
      Effect.provideService(
        SubmissionReportRepositoryTag,
        this.reportRepository,
      ),
    );

    return await effectToControllerResult(effect);
  }

  /**
   * Get all reports for a submission
   */
  async getBySubmission(input: unknown): Promise<
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
            reporter: {
              id: string;
              user: {
                id: string;
                firstName: string;
                lastName: string;
                email: string | null;
                hasAvatar: boolean;
              };
            };
          }>;
          totalCount: number;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getBySubmission.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getReportsUseCase({
      submissionId: parsed.data.submissionId,
    }).pipe(
      Effect.provideService(
        SubmissionReportRepositoryTag,
        this.reportRepository,
      ),
    );

    return await effectToControllerResult(effect);
  }
}
