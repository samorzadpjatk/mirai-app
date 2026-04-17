import { Effect } from "effect";
import {
  SubmissionReportId,
  ChallengeSubmissionId,
  DatabaseError,
} from "@mirai-app/domain";
import type {
  ISubmissionReportPort,
  SubmissionReport,
  SubmissionReportWithReporter,
} from "@mirai-app/use-cases";

/**
 * In-Memory Submission Report Gateway
 *
 * Implements ISubmissionReportPort using in-memory Map storage for testing.
 */
export class InMemorySubmissionReportGateway implements ISubmissionReportPort {
  private reports: Map<string, SubmissionReport> = new Map();

  findById(
    id: SubmissionReportId,
  ): Effect.Effect<SubmissionReport | null, DatabaseError, never> {
    return Effect.sync(() => {
      const idString = SubmissionReportId.toString(id);
      const report = this.reports.get(idString);
      return report ?? null;
    });
  }

  findBySubmissionId(
    submissionId: ChallengeSubmissionId,
  ): Effect.Effect<SubmissionReportWithReporter[], DatabaseError, never> {
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

  create(
    report: Omit<SubmissionReport, "id" | "createdAt">,
  ): Effect.Effect<SubmissionReport, DatabaseError, never> {
    return Effect.sync(() => {
      const id = SubmissionReportId.generate();
      const createdAt = new Date();
      const newReport: SubmissionReport = {
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
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.sync(() => {
      const submissionIdString = ChallengeSubmissionId.toString(submissionId);
      return Array.from(this.reports.values()).some(
        (report) =>
          ChallengeSubmissionId.toString(report.submissionId) ===
            submissionIdString && report.reporterId === reporterId,
      );
    });
  }

  countBySubmissionId(
    submissionId: ChallengeSubmissionId,
  ): Effect.Effect<number, DatabaseError, never> {
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
  addReport(report: SubmissionReport): void {
    this.reports.set(SubmissionReportId.toString(report.id), report);
  }

  /**
   * Helper method to clear all data (for testing)
   */
  clear(): void {
    this.reports.clear();
  }
}
