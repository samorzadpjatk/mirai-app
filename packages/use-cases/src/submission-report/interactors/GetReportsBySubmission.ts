import { Effect } from "effect";
import { ChallengeSubmissionId, UserId } from "@mirai-app/domain";
import { SubmissionReportPortTag } from "../ports/SubmissionReportPort";
import { ChallengeSubmissionPortTag } from "../../challenge-submission/ports/ChallengeSubmissionPort";
import { SubmissionNotFoundError } from "../errors/SubmissionReportErrors";
import type {
  GetReportsBySubmissionInputDTO,
  GetReportsBySubmissionResultDTO,
  SubmissionReportWithReporterDTO,
} from "../dto/SubmissionReportDTOs";

/**
 * Get Reports By Submission Use Case
 *
 * Retrieves all reports for a specific submission (moderator only).
 * Returns reports with reporter information including email.
 */
export class GetReportsBySubmissionUseCase {
  execute(input: GetReportsBySubmissionInputDTO) {
    return Effect.gen(function* () {
      const reportPort = yield* SubmissionReportPortTag;
      const submissionPort = yield* ChallengeSubmissionPortTag;

      // Validate submission exists
      const submission = yield* submissionPort.findById(input.submissionId);

      if (!submission) {
        return yield* Effect.fail(
          new SubmissionNotFoundError({ submissionId: input.submissionId }),
        );
      }

      // Get all reports for the submission
      const submissionId = ChallengeSubmissionId.create(input.submissionId);
      const reports = yield* reportPort.findBySubmissionId(submissionId);

      // Map to DTOs
      const reportDTOs: SubmissionReportWithReporterDTO[] = reports.map(
        (report) => ({
          id: report.id,
          submissionId: report.submissionId,
          reporterId: report.reporterId,
          reason: report.reason,
          details: report.details,
          createdAt: report.createdAt,
          reporter: report.reporter
            ? {
                id: report.reporter.id,
                user: {
                  id: UserId.unsafeCreate(report.reporter.user.id),
                  firstName: report.reporter.user.firstName,
                  lastName: report.reporter.user.lastName,
                  email: null, // Will be hydrated by adapter
                },
              }
            : null,
        }),
      );

      return {
        reports: reportDTOs,
      };
    });
  }
}
