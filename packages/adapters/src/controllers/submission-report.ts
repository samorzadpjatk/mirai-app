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
} from "./validators/submission-report-validators";

export {
  validateCreateReportInput,
  validateGetBySubmissionInput,
};

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
}
