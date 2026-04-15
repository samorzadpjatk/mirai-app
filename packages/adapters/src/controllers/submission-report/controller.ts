import { Effect, type Layer } from "effect";
import type { SubmissionReport } from "@mirai-app/domain";
import {
  createReportUseCase,
  getReportsUseCase,
  SubmissionReportRepositoryTag,
  type CreateReportInput,
  type GetReportsInput,
} from "@mirai-app/use-cases";
import {
  validateCreateReportInput,
  validateGetBySubmissionInput,
} from "./validators/schema";

export { validateCreateReportInput, validateGetBySubmissionInput };

/**
 * Input validation schemas for submission report controller
 */

/**
 * Helper to run an Effect with the provided Layer and convert to controller result
 */
async function runWithLayer<T>(
  effect: Effect.Effect<T, unknown, unknown>,
  layer: Layer.Layer<unknown>,
  transform?: (value: T) => unknown,
): Promise<
  { success: true; data: unknown } | { success: false; error: string }
> {
  const provided = effect.pipe(Effect.provide(layer));
  const result = await Effect.runPromise(Effect.either(provided));

  if (result._tag === "Left") {
    const error = result.left;
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }

  return {
    success: true,
    data: transform ? transform(result.right) : result.right,
  };
}

/**
 * SubmissionReportController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class SubmissionReportController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

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
    const parsed = validateCreateReportInput(input);
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
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as
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
      | { success: false; error: string };
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
    const parsed = validateGetBySubmissionInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getReportsUseCase({
      submissionId: parsed.data.submissionId,
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as
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
      | { success: false; error: string };
  }

  /**
   * Get a report by ID
   */
  async getById(input: { id: string }): Promise<
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
  > {
    const program = Effect.gen(function* () {
      const reportRepo = yield* SubmissionReportRepositoryTag;
      const report = yield* reportRepo.findById(input.id);

      if (!report) {
        return null;
      }

      return {
        id: report.id,
        submissionId: report.submissionId,
        reporterId: report.reporterId,
        reason: report.reason.value,
        reasonDisplay: report.getReasonDisplay(),
        details: report.details,
        createdAt: report.createdAt,
      };
    });

    const result = await runWithLayer(program, this.appLayer);

    if (!result.success) {
      return result as { success: false; error: string };
    }

    return {
      success: true,
      data: result.data as {
        id: string;
        submissionId: string;
        reporterId: string;
        reason: string;
        reasonDisplay: string;
        details: string | null;
        createdAt: Date;
      } | null,
    };
  }

  /**
   * Get all reports with optional filters
   */
  async getReports(input: {
    submissionId?: string;
    reporterId?: string;
    reason?: string;
    limit?: number;
    offset?: number;
  }): Promise<
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
  > {
    const program = Effect.gen(function* () {
      const reportRepo = yield* SubmissionReportRepositoryTag;

      let reports: Array<{
        id: string;
        submissionId: string;
        reporterId: string;
        reason: string;
        reasonDisplay: string;
        details: string | null;
        createdAt: Date;
      }> = [];

      if (input.submissionId) {
        const submissionReports = yield* reportRepo.findBySubmissionId(
          input.submissionId,
        );
        reports = submissionReports.map((r) => ({
          id: r.id,
          submissionId: r.submissionId,
          reporterId: r.reporterId,
          reason: r.reason.value,
          reasonDisplay: r.getReasonDisplay(),
          details: r.details,
          createdAt: r.createdAt,
        }));
      } else if (input.reporterId) {
        const reporterReports = yield* reportRepo.findByReporterId(
          input.reporterId,
        );
        reports = reporterReports.map((r) => ({
          id: r.id,
          submissionId: r.submissionId,
          reporterId: r.reporterId,
          reason: r.reason.value,
          reasonDisplay: r.getReasonDisplay(),
          details: r.details,
          createdAt: r.createdAt,
        }));
      } else {
        const allReports = yield* reportRepo.findAll({
          limit: input.limit,
          offset: input.offset,
        });
        reports = allReports.map((r) => ({
          id: r.id,
          submissionId: r.submissionId,
          reporterId: r.reporterId,
          reason: r.reason.value,
          reasonDisplay: r.getReasonDisplay(),
          details: r.details,
          createdAt: r.createdAt,
        }));
      }

      // Apply reason filter if provided
      if (input.reason) {
        reports = reports.filter((r) => r.reason === input.reason);
      }

      return {
        reports,
        total: reports.length,
      };
    });

    const result = await runWithLayer(program, this.appLayer);

    if (!result.success) {
      return result as { success: false; error: string };
    }

    return {
      success: true,
      data: result.data as {
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
      },
    };
  }

  /**
   * Get reports by submission ID
   */
  async getBySubmissionId(input: { submissionId: string }): Promise<
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
  > {
    const result = await this.getReports({ submissionId: input.submissionId });

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: result.data.reports,
    };
  }

  /**
   * Get reports by reporter ID
   */
  async getByReporterId(input: {
    reporterId: string;
    limit?: number;
    offset?: number;
  }): Promise<
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
  > {
    const result = await this.getReports({
      reporterId: input.reporterId,
      limit: input.limit,
      offset: input.offset,
    });

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: result.data.reports,
    };
  }

  /**
   * Delete a report by ID
   */
  async delete(input: {
    id: string;
  }): Promise<
    | { success: true; data: { deleted: boolean } }
    | { success: false; error: string }
  > {
    const program = Effect.gen(function* () {
      const reportRepo = yield* SubmissionReportRepositoryTag;

      // Check if report exists
      const exists = yield* reportRepo.exists(input.id);
      if (!exists) {
        return { deleted: false };
      }

      // Delete the report
      yield* reportRepo.delete(input.id);

      return { deleted: true };
    });

    const result = await runWithLayer(program, this.appLayer);

    if (!result.success) {
      return result as { success: false; error: string };
    }

    return {
      success: true,
      data: result.data as { deleted: boolean },
    };
  }
}
