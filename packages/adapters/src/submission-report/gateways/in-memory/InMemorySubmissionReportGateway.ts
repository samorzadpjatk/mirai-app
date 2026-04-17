import { Effect } from "effect";
import { SubmissionReportId, ChallengeSubmissionId } from "@mirai-app/domain";
import type { submissionReport } from "@mirai-app/use-cases";

/**
 * In-Memory Submission Report Gateway
 *
 * Implements ISubmissionReportPort using in-memory Map storage for testing.
 */
export class InMemorySubmissionReportGateway
  implements submissionReport.ISubmissionReportPort
{
  private reports: Map<string, submissionReport.SubmissionReport> = new Map();

  findById(id: SubmissionReportId) {
    return Effect.sync(() => {
      const idString = SubmissionReportId.toString(id);
      const report = this.reports.get(idString);
      return report ?? null;
    });
  }

  findBySubmissionId(submissionId: ChallengeSubmissionId) {
    return Effect.sync(() => {
      const submissionIdString = ChallengeSubmissionId.toString(submissionId);
      return Array.from(this.reports.values())
        .filter(
          (report) =>
            ChallengeSubmissionId.toString(report.submissionId) ===
            submissionIdString,
        )
        .map((report) => ({
          ...report,
          reporter: null,
        }));
    });
  }

  create(report: Omit<submissionReport.SubmissionReport, "id" | "createdAt">) {
    return Effect.sync(() => {
      const id = SubmissionReportId.generate();
      const createdAt = new Date();
      const newReport: submissionReport.SubmissionReport = {
        id,
        submissionId: report.submissionId,
        reporterId: report.reporterId,
        reason: report.reason,
        details: report.details,
        createdAt,
      };
      this.reports.set(SubmissionReportId.toString(id), newReport);
      return newReport;
    });
  }

  existsBySubmissionAndReporter(
    submissionId: ChallengeSubmissionId,
    reporterId: string,
  ) {
    return Effect.sync(() => {
      const submissionIdString = ChallengeSubmissionId.toString(submissionId);
      return Array.from(this.reports.values()).some(
        (report) =>
          ChallengeSubmissionId.toString(report.submissionId) ===
            submissionIdString && report.reporterId === reporterId,
      );
    });
  }

  countBySubmissionId(submissionId: ChallengeSubmissionId) {
    return Effect.sync(() => {
      const submissionIdString = ChallengeSubmissionId.toString(submissionId);
      return Array.from(this.reports.values()).filter(
        (report) =>
          ChallengeSubmissionId.toString(report.submissionId) ===
          submissionIdString,
      ).length;
    });
  }

  /**
   * Helper method to add a report (for testing)
   */
  addReport(report: submissionReport.SubmissionReport): void {
    this.reports.set(SubmissionReportId.toString(report.id), report);
  }

  /**
   * Helper method to clear all data (for testing)
   */
  clear(): void {
    this.reports.clear();
  }
}
