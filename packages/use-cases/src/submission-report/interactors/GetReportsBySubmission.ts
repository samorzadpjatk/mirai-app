import { Effect } from "effect";
import {
  ChallengeSubmissionId,
  UserId,
  AuthUserId,
  ChallengeSubmissionId as ChallengeSubmissionIdFactory,
} from "@mirai-app/domain";
import { SubmissionReportPortTag } from "../ports/SubmissionReportPort";
import { ChallengeSubmissionPortTag } from "../../challenge-submission/ports/ChallengeSubmissionPort";
import { AuthServicePortTag } from "../../user/ports/AuthServicePort";
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
      const authServicePort = yield* AuthServicePortTag;

      // Validate submission exists
      const submissionId = ChallengeSubmissionIdFactory.create(
        input.submissionId,
      );
      const submission = yield* submissionPort.findById(submissionId);

      if (!submission) {
        return yield* Effect.fail(
          new SubmissionNotFoundError({ submissionId: input.submissionId }),
        );
      }

      // Get all reports for the submission
      const reports = yield* reportPort.findBySubmissionId(submissionId);

      // Fetch auth info for all reporters in parallel
      const reporterAuthInfos =
        reports.length > 0
          ? yield* Effect.all(
              reports.map((report) =>
                report.reporter?.user.authUserId
                  ? authServicePort.getUserInfoByAuthId(
                      AuthUserId.toString(
                        AuthUserId.unsafeCreate(report.reporter.user.authUserId),
                      ),
                    )
                  : Effect.succeed(null),
              ),
              { concurrency: "unbounded" },
            )
          : [];

      // Map to DTOs with fully-populated user data including email
      const reportDTOs: SubmissionReportWithReporterDTO[] = reports.map(
        (report, index) => {
          const authInfo = reporterAuthInfos[index];
          return {
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
                    email: authInfo?.email ?? null,
                  },
                }
              : null,
          };
        },
      );

      return {
        reports: reportDTOs,
      };
    });
  }
}
