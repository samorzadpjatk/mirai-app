import { Effect } from "effect";
import type { SubmissionReport } from "@mirai-app/domain";
import { SubmissionReportRepositoryTag } from "../ports/SubmissionReportRepository";

/**
 * Reporter output DTO
 */
export interface ReporterOutput {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    hasAvatar: boolean;
  };
}

/**
 * Report output DTO
 */
export interface ReportOutput {
  id: string;
  submissionId: string;
  reporterId: string;
  reason: string;
  reasonDisplay: string;
  details: string | null;
  createdAt: Date;
  reporter: ReporterOutput;
}

/**
 * Input for GetReports use case
 */
export interface GetReportsInput {
  submissionId: string;
}

/**
 * Output DTO for GetReports use case
 */
export interface GetReportsOutput {
  reports: ReportOutput[];
  totalCount: number;
}

/**
 * GetReports Use Case
 *
 * Gets all reports for a specific submission.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * // With dependency injection
 * const program = getReportsUseCase(input);
 *
 * // Provide repository implementation
 * const runnable = program.pipe(
 *   Effect.provideService(SubmissionReportRepositoryTag, repository)
 * );
 *
 * // Run the effect
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function getReportsUseCase(
  input: GetReportsInput,
): Effect.Effect<GetReportsOutput, never, SubmissionReportRepositoryTag> {
  return Effect.gen(function* () {
    const reportRepo = yield* SubmissionReportRepositoryTag;

    // Find all reports for the submission
    const reports = yield* reportRepo.findBySubmissionId(input.submissionId);

    const count = yield* reportRepo.countBySubmissionId(input.submissionId);

    return {
      reports: reports.map((report) => toOutput(report)),
      totalCount: count,
    };
  });
}

function toOutput(report: SubmissionReport): ReportOutput {
  // Build reporter info from domain entity
  const reporterInfo = report.reporter ?? {
    reporterId: report.reporterId,
    participantId: report.reporterId,
    userId: "",
    firstName: "",
    lastName: "",
    email: null,
    hasAvatar: false,
  };

  return {
    id: report.id,
    submissionId: report.submissionId,
    reporterId: report.reporterId,
    reason: report.reason.value,
    reasonDisplay: report.getReasonDisplay(),
    details: report.details,
    createdAt: report.createdAt,
    reporter: {
      id: reporterInfo.participantId,
      user: {
        id: reporterInfo.userId,
        firstName: reporterInfo.firstName,
        lastName: reporterInfo.lastName,
        email: reporterInfo.email,
        hasAvatar: reporterInfo.hasAvatar,
      },
    },
  };
}
