import { Effect, Context } from "effect";
import { SubmissionReportId, ChallengeSubmissionId, DatabaseError, type IAuthZPort } from "@mirai-app/domain";
import type { submissionReport } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";

// Local AuthZPortTag to avoid circular dependency issues
class AuthZPortTag extends Context.Tag("AuthZ")<AuthZPortTag, IAuthZPort>() {}

/**
 * In-Memory Submission Report Gateway
 *
 * Implements ISubmissionReportPort using in-memory Map storage for testing.
 *
 * Authorization Pattern:
 * - findById: Admin only (reports are sensitive)
 * - findBySubmissionId: Admin or trip leader
 * - create: Any authenticated user can report
 * - existsBySubmissionAndReporter: Users can check their own reports
 * - countBySubmissionId: Admin or trip leader
 */
export class InMemorySubmissionReportGateway
  implements submissionReport.ISubmissionReportPort
{
  private reports: Map<string, submissionReport.SubmissionReport> = new Map();

  findById(id: SubmissionReportId) {
    const self = this;
    const idString = SubmissionReportId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext - admin only for viewing reports
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        // Reports are sensitive - require admin access
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "challengeSubmission",
          resourceId: idString,
          requiredPermission: "admin",
        });
      }

      const report = self.reports.get(idString);
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
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext - any authenticated user can create a report
      const authCtx = yield* AuthContextTag;

      // Authentication required to create reports
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "create",
            id: "",
            cause: new Error("Authentication required to submit a report"),
          }),
        );
      }

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
      self.reports.set(SubmissionReportId.toString(id), newReport);
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
