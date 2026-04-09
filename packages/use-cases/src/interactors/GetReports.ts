import type { Result } from "@repo/domain";
import { ok, SubmissionReport } from "@repo/domain";
import type { SubmissionReportRepository } from "../ports/SubmissionReportRepository";

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
 */
export class GetReportsUseCase {
  constructor(private reportRepository: SubmissionReportRepository) {}

  async execute(
    input: GetReportsInput,
  ): Promise<Result<GetReportsOutput, string>> {
    // Find all reports for the submission
    const reports = await this.reportRepository.findBySubmissionId(
      input.submissionId,
    );

    const count = await this.reportRepository.countBySubmissionId(
      input.submissionId,
    );

    return ok({
      reports: reports.map((report) => this.toOutput(report)),
      totalCount: count,
    });
  }

  private toOutput(report: SubmissionReport): ReportOutput {
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
}
