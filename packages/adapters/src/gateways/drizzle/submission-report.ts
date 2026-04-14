import type { SubmissionReportRepository } from "@mirai-app/use-cases";
import type { SubmissionReport } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  submissionReports,
  tripParticipants,
  users,
  type SubmissionReportSelect,
  type SubmissionReportInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { Effect } from "effect";
import { BaseDrizzleRepository } from "../base/repository";
import { SubmissionReportDrizzleMapper } from "../../mappers/drizzle/submission-report";
import { DatabaseError } from "@mirai-app/adapters/errors";

// Include config for reporter info
const REPORTER_INCLUDE = {
  reporter: {
    participantId: tripParticipants.id,
    userId: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
    hasAvatar: users.hasAvatar,
  },
};

/**
 * DrizzleSubmissionReportRepository
 *
 * Implements the SubmissionReportRepository port using Drizzle ORM.
 * Uses BaseDrizzleRepository for standard CRUD operations.
 */
export class DrizzleSubmissionReportRepository
  extends BaseDrizzleRepository<
    SubmissionReport,
    SubmissionReportSelect,
    SubmissionReportInsert,
    typeof submissionReports
  >
  implements SubmissionReportRepository
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: submissionReports,
      mapper: SubmissionReportDrizzleMapper.instance,
    });
  }

  /**
   * Find reports by submission ID
   */
  findBySubmissionId(
    submissionId: string,
  ): Effect.Effect<SubmissionReport[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select({
            id: submissionReports.id,
            submissionId: submissionReports.submissionId,
            reporterId: submissionReports.reporterId,
            reason: submissionReports.reason,
            details: submissionReports.details,
            createdAt: submissionReports.createdAt,
            participantId: tripParticipants.id,
            userId: users.id,
            userFirstName: users.firstName,
            userLastName: users.lastName,
            userHasAvatar: users.hasAvatar,
          })
          .from(submissionReports)
          .leftJoin(
            tripParticipants,
            eq(submissionReports.reporterId, tripParticipants.id),
          )
          .leftJoin(users, eq(tripParticipants.userId, users.id))
          .where(eq(submissionReports.submissionId, submissionId))
          .orderBy(desc(submissionReports.createdAt));

        return records.map((r) =>
          this.mapper.toDomain({
            id: r.id,
            submissionId: r.submissionId,
            reporterId: r.reporterId,
            reason: r.reason,
            details: r.details,
            createdAt: r.createdAt,
            participantId: r.participantId,
            userId: r.userId,
            userFirstName: r.userFirstName,
            userLastName: r.userLastName,
            userHasAvatar: r.userHasAvatar,
          } as any),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findBySubmissionId",
          message: `Failed to find submission reports by submission ID ${submissionId}`,
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Find reports by reporter ID
   */
  findByReporterId(
    reporterId: string,
  ): Effect.Effect<SubmissionReport[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select({
            id: submissionReports.id,
            submissionId: submissionReports.submissionId,
            reporterId: submissionReports.reporterId,
            reason: submissionReports.reason,
            details: submissionReports.details,
            createdAt: submissionReports.createdAt,
            participantId: tripParticipants.id,
            userId: users.id,
            userFirstName: users.firstName,
            userLastName: users.lastName,
            userHasAvatar: users.hasAvatar,
          })
          .from(submissionReports)
          .leftJoin(
            tripParticipants,
            eq(submissionReports.reporterId, tripParticipants.id),
          )
          .leftJoin(users, eq(tripParticipants.userId, users.id))
          .where(eq(submissionReports.reporterId, reporterId))
          .orderBy(desc(submissionReports.createdAt));

        return records.map((r) =>
          this.mapper.toDomain({
            id: r.id,
            submissionId: r.submissionId,
            reporterId: r.reporterId,
            reason: r.reason,
            details: r.details,
            createdAt: r.createdAt,
            participantId: r.participantId,
            userId: r.userId,
            userFirstName: r.userFirstName,
            userLastName: r.userLastName,
            userHasAvatar: r.userHasAvatar,
          } as any),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByReporterId",
          message: `Failed to find submission reports by reporter ID ${reporterId}`,
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Find reports by reason
   */
  findByReason(
    reason: string,
  ): Effect.Effect<SubmissionReport[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select({
            id: submissionReports.id,
            submissionId: submissionReports.submissionId,
            reporterId: submissionReports.reporterId,
            reason: submissionReports.reason,
            details: submissionReports.details,
            createdAt: submissionReports.createdAt,
            participantId: tripParticipants.id,
            userId: users.id,
            userFirstName: users.firstName,
            userLastName: users.lastName,
            userHasAvatar: users.hasAvatar,
          })
          .from(submissionReports)
          .leftJoin(
            tripParticipants,
            eq(submissionReports.reporterId, tripParticipants.id),
          )
          .leftJoin(users, eq(tripParticipants.userId, users.id))
          .where(eq(submissionReports.reason, reason))
          .orderBy(desc(submissionReports.createdAt));

        return records.map((r) =>
          this.mapper.toDomain({
            id: r.id,
            submissionId: r.submissionId,
            reporterId: r.reporterId,
            reason: r.reason,
            details: r.details,
            createdAt: r.createdAt,
            participantId: r.participantId,
            userId: r.userId,
            userFirstName: r.userFirstName,
            userLastName: r.userLastName,
            userHasAvatar: r.userHasAvatar,
          } as any),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByReason",
          message: `Failed to find submission reports by reason ${reason}`,
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Override findById to include reporter info
   */
  override findById(
    id: string,
  ): Effect.Effect<SubmissionReport | null, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .select({
            id: submissionReports.id,
            submissionId: submissionReports.submissionId,
            reporterId: submissionReports.reporterId,
            reason: submissionReports.reason,
            details: submissionReports.details,
            createdAt: submissionReports.createdAt,
            participantId: tripParticipants.id,
            userId: users.id,
            userFirstName: users.firstName,
            userLastName: users.lastName,
            userHasAvatar: users.hasAvatar,
          })
          .from(submissionReports)
          .leftJoin(
            tripParticipants,
            eq(submissionReports.reporterId, tripParticipants.id),
          )
          .leftJoin(users, eq(tripParticipants.userId, users.id))
          .where(eq(submissionReports.id, id))
          .limit(1);

        if (!record) return null;

        return this.mapper.toDomain({
          id: record.id,
          submissionId: record.submissionId,
          reporterId: record.reporterId,
          reason: record.reason,
          details: record.details,
          createdAt: record.createdAt,
          participantId: record.participantId,
          userId: record.userId,
          userFirstName: record.userFirstName,
          userLastName: record.userLastName,
          userHasAvatar: record.userHasAvatar,
        } as any);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findById",
          message: `Failed to find submission report by ID ${id}`,
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Override findAll to include reporter info
   */
  override findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<SubmissionReport[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const buildQuery = () => {
          let query = this.db
            .select({
              id: submissionReports.id,
              submissionId: submissionReports.submissionId,
              reporterId: submissionReports.reporterId,
              reason: submissionReports.reason,
              details: submissionReports.details,
              createdAt: submissionReports.createdAt,
              participantId: tripParticipants.id,
              userId: users.id,
              userFirstName: users.firstName,
              userLastName: users.lastName,
              userHasAvatar: users.hasAvatar,
            })
            .from(submissionReports)
            .leftJoin(
              tripParticipants,
              eq(submissionReports.reporterId, tripParticipants.id),
            )
            .leftJoin(users, eq(tripParticipants.userId, users.id))
            .orderBy(desc(submissionReports.createdAt));
          return query;
        };

        let query = buildQuery();

        if (options?.limit) {
          query = query.limit(options.limit) as unknown as typeof query;
        }
        if (options?.offset) {
          query = query.offset(options.offset) as unknown as typeof query;
        }

        const records = await query;

        return records.map((r) =>
          this.mapper.toDomain({
            id: r.id,
            submissionId: r.submissionId,
            reporterId: r.reporterId,
            reason: r.reason,
            details: r.details,
            createdAt: r.createdAt,
            participantId: r.participantId,
            userId: r.userId,
            userFirstName: r.userFirstName,
            userLastName: r.userLastName,
            userHasAvatar: r.userHasAvatar,
          } as any),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAll",
          message: "Failed to find all submission reports",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Count reports for a submission
   */
  countBySubmissionId(
    submissionId: string,
  ): Effect.Effect<number, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(submissionReports)
          .where(eq(submissionReports.submissionId, submissionId))
          .limit(1);

        return result?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countBySubmissionId",
          message: `Failed to count submission reports for submission ${submissionId}`,
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Check if a reporter has already reported a submission
   */
  existsBySubmissionAndReporter(
    submissionId: string,
    reporterId: string,
  ): Effect.Effect<boolean, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(submissionReports)
          .where(
            and(
              eq(submissionReports.submissionId, submissionId),
              eq(submissionReports.reporterId, reporterId),
            ),
          )
          .limit(1);

        return (result?.count ?? 0) > 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "existsBySubmissionAndReporter",
          message: "Failed to check if submission report exists",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }
}
