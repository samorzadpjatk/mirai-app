import type { SubmissionReportRepository } from "@mirai-app/use-cases";
import type { SubmissionReport } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { submissionReports } from "@mirai-app/frameworks/drizzle/schema/submissionReport";
import { tripParticipants } from "@mirai-app/frameworks/drizzle/schema/trip";
import { users } from "@mirai-app/frameworks/drizzle/schema/user";
import { eq, and, desc, sql } from "drizzle-orm";
import { BaseDrizzleRepository } from "../BaseDrizzleRepository";
import { SubmissionReportDrizzleMapper } from "../../mappers/drizzle/SubmissionReportDrizzleMapper";

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
    typeof submissionReports.$inferSelect,
    Partial<typeof submissionReports.$inferInsert>,
    Partial<typeof submissionReports.$inferInsert>
  >
  implements SubmissionReportRepository
{
  constructor(db: DrizzleDb) {
    super(
      db,
      { table: submissionReports },
      SubmissionReportDrizzleMapper.instance,
    );
  }

  /**
   * Find reports by submission ID
   */
  async findBySubmissionId(submissionId: string): Promise<SubmissionReport[]> {
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
  }

  /**
   * Find reports by reporter ID
   */
  async findByReporterId(reporterId: string): Promise<SubmissionReport[]> {
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
  }

  /**
   * Find reports by reason
   */
  async findByReason(reason: string): Promise<SubmissionReport[]> {
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
  }

  /**
   * Override findById to include reporter info
   */
  async findById(id: string): Promise<SubmissionReport | null> {
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
  }

  /**
   * Override findAll to include reporter info
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<SubmissionReport[]> {
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

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
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
  }

  /**
   * Count reports for a submission
   */
  async countBySubmissionId(submissionId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(submissionReports)
      .where(eq(submissionReports.submissionId, submissionId))
      .limit(1);

    return result?.count ?? 0;
  }

  /**
   * Check if a reporter has already reported a submission
   */
  async existsBySubmissionAndReporter(
    submissionId: string,
    reporterId: string,
  ): Promise<boolean> {
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
  }
}
