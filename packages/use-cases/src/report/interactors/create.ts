import { Effect, Data } from "effect";
import { SubmissionReport } from "@mirai-app/domain";
import { SubmissionReportGatewayTag } from "../ports/gateway";

/**
 * Input for CreateReport use case
 */
export interface CreateReportInput {
  submissionId: string;
  reporterId: string;
  reason: string;
  details?: string | null;
}

/**
 * Output DTO for CreateReport use case
 */
export interface CreateReportOutput {
  id: string;
  submissionId: string;
  reporterId: string;
  reason: string;
  reasonDisplay: string;
  details: string | null;
  createdAt: Date;
}

/**
 * Error types for CreateReport use case
 */
export class DuplicateReportError extends Data.TaggedError(
  "DuplicateReportError",
)<{
  message: string;
}> {
  constructor() {
    super({ message: "You have already reported this submission" });
  }
}

export class CreateReportValidationError extends Data.TaggedError(
  "CreateReportValidationError",
)<{
  message: string;
}> {
  constructor(message: string) {
    super({ message });
  }
}

/**
 * CreateReport Use Case
 *
 * Creates a new submission report.
 * Returns error if validation fails.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * // With dependency injection
 * const program = createReportUseCase(input);
 *
 * // Provide repository implementation
 * const runnable = program.pipe(
 *   Effect.provideService(SubmissionReportGatewayTag, repository)
 * );
 *
 * // Run the effect
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function createReportUseCase(
  input: CreateReportInput,
): Effect.Effect<
  CreateReportOutput,
  DuplicateReportError | CreateReportValidationError,
  SubmissionReportGatewayTag
> {
  return Effect.gen(function* () {
    const reportRepo = yield* SubmissionReportGatewayTag;

    // Check if reporter already reported this submission
    const alreadyExists = yield* reportRepo.existsBySubmissionAndReporter(
      input.submissionId,
      input.reporterId,
    );

    if (alreadyExists) {
      return yield* Effect.fail(new DuplicateReportError());
    }

    // Create domain entity - returns Effect from domain
    const report = yield* SubmissionReport.create({
      submissionId: input.submissionId,
      reporterId: input.reporterId,
      reason: input.reason,
      ...(input.details !== undefined && { details: input.details }),
    }).pipe(
      Effect.mapError(
        (validationError) =>
          new CreateReportValidationError(validationError.message),
      ),
    );

    // Persist report
    const saved = yield* reportRepo.create(report);

    return toOutput(saved);
  });
}

function toOutput(report: SubmissionReport): CreateReportOutput {
  return {
    id: report.id,
    submissionId: report.submissionId,
    reporterId: report.reporterId,
    reason: report.reason.value,
    reasonDisplay: report.getReasonDisplay(),
    details: report.details,
    createdAt: report.createdAt,
  };
}
