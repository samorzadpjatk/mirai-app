import { Effect } from "effect";
import { eq, and, count } from "drizzle-orm";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import {
  submissionReports,
  users,
  type SubmissionReportSelect,
} from "../../../infrastructure/drizzle";
import { SubmissionReportId, ChallengeSubmissionId, DatabaseError } from "@mirai-app/domain";
import type { submissionReport } from "@mirai-app/use-cases";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";

/**
 * Submission Report Drizzle Gateway
 *
 * Implements ISubmissionReportPort using Drizzle ORM for database operations.
 * Uses AuthContext and AuthZPortTag for authorization.
 *
 * Authorization Pattern:
 * - findById: Admin only (reports are sensitive)
 * - findBySubmissionId: Admin or trip leader
 * - create: Any authenticated user can report
 * - existsBySubmissionAndReporter: Users can check their own reports
 * - countBySubmissionId: Admin or trip leader
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
    const self = this;

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

      // Proceed with database operation
      const dbReport = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .select()
            .from(submissionReports)
            .where(eq(submissionReports.id, idString))
            .limit(1);
          return result[0] ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findById",
            id: idString,
            cause: error,
          }),
      });

      return dbReport ? self.toDomain(dbReport) : null;
    });
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

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          const [result] = await self.db
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
        catch: (error) =>
          new DatabaseError({
            operation: "create",
            id: "",
            cause: error,
          }),
      }).pipe(
        Effect.map((dbReport: SubmissionReportSelect) => self.toDomain(dbReport)),
      );
    });
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
