import { Effect } from "effect";
import { eq, and, count } from "drizzle-orm";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import {
  submissionReports,
  users,
  type SubmissionReportSelect,
} from "../../../infrastructure/drizzle";
import { SubmissionReportId, ChallengeSubmissionId } from "@mirai-app/domain";
import type { submissionReport } from "@mirai-app/use-cases";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";

/**
 * Submission Report Drizzle Gateway
 *
 * Implements ISubmissionReportPort using Drizzle ORM for database operations.
 */
export class SubmissionReportDrizzleGateway
  extends BaseDrizzleGateway
  implements submissionReport.ISubmissionReportPort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  findById(id: SubmissionReportId) {
    const idString = SubmissionReportId.toString(id);
    return this.tryPromise(
      "findById",
      async () => {
        const result = await this.db
          .select()
          .from(submissionReports)
          .where(eq(submissionReports.id, idString))
          .limit(1);
        return result[0] ?? null;
      },
      idString,
    ).pipe(
      Effect.map((dbReport: SubmissionReportSelect | null) =>
        dbReport ? this.toDomain(dbReport) : null,
      ),
    );
  }

  findBySubmissionId(submissionId: ChallengeSubmissionId) {
    const submissionIdString = ChallengeSubmissionId.toString(submissionId);
    return this.tryPromise(
      "findBySubmissionId",
      async () => {
        const results = await this.db
          .select({
            report: submissionReports,
            reporter: users,
          })
          .from(submissionReports)
          .leftJoin(users, eq(submissionReports.reporterId, users.id))
          .where(eq(submissionReports.submissionId, submissionIdString))
          .orderBy(submissionReports.createdAt);
        return results;
      },
      submissionIdString,
    ).pipe(
      Effect.map((results) =>
        results.map((row) => ({
          ...this.toDomain(row.report),
          reporter: row.reporter
            ? {
                id: row.reporter.id,
                user: {
                  id: row.reporter.id,
                  firstName: row.reporter.firstName,
                  lastName: row.reporter.lastName,
                  authUserId: row.reporter.authUserId,
                },
              }
            : null,
        })),
      ),
    );
  }

  create(report: Omit<submissionReport.SubmissionReport, "id" | "createdAt">) {
    return this.tryPromise(
      "create",
      async () => {
        const [result] = await this.db
          .insert(submissionReports)
          .values({
            submissionId: ChallengeSubmissionId.toString(report.submissionId),
            reporterId: report.reporterId,
            reason: report.reason,
            details: report.details,
          })
          .returning();
        if (!result) throw new Error("Failed to create submission report");
        return result;
      },
      report.submissionId,
    ).pipe(
      Effect.map((dbReport: SubmissionReportSelect) => this.toDomain(dbReport)),
    );
  }

  existsBySubmissionAndReporter(
    submissionId: ChallengeSubmissionId,
    reporterId: string,
  ) {
    const submissionIdString = ChallengeSubmissionId.toString(submissionId);
    return this.tryPromise(
      "existsBySubmissionAndReporter",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(submissionReports)
          .where(
            and(
              eq(submissionReports.submissionId, submissionIdString),
              eq(submissionReports.reporterId, reporterId),
            ),
          );
        return (result[0]?.count ?? 0) > 0;
      },
      submissionIdString,
    );
  }

  countBySubmissionId(submissionId: ChallengeSubmissionId) {
    const submissionIdString = ChallengeSubmissionId.toString(submissionId);
    return this.tryPromise(
      "countBySubmissionId",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(submissionReports)
          .where(eq(submissionReports.submissionId, submissionIdString));
        return result[0]?.count ?? 0;
      },
      submissionIdString,
    );
  }

  /**
   * Convert database record to domain entity
   */
  private toDomain(
    dbReport: SubmissionReportSelect,
  ): submissionReport.SubmissionReport {
    return {
      id: SubmissionReportId.unsafeCreate(dbReport.id),
      submissionId: ChallengeSubmissionId.unsafeCreate(dbReport.submissionId),
      reporterId: dbReport.reporterId,
      reason: dbReport.reason,
      details: dbReport.details ?? null,
      createdAt: dbReport.createdAt,
    };
  }
}
