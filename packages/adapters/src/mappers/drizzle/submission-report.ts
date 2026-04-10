import type { SubmissionReport, ReporterInfo } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../gateways/base/repository";
import type { submissionReports } from "@mirai-app/frameworks/drizzle/schema/submissionReport";

/**
 * SubmissionReportDrizzleMapper
 *
 * Maps between Drizzle database records and domain SubmissionReport entities.
 * Implements the DrizzleEntityMapper interface for standard repository operations.
 */
export class SubmissionReportDrizzleMapper implements DrizzleEntityMapper<
  SubmissionReport,
  typeof submissionReports.$inferSelect,
  Partial<typeof submissionReports.$inferInsert>,
  Partial<typeof submissionReports.$inferInsert>
> {
  /**
   * Convert a Drizzle SubmissionReport record to a domain entity
   */
  toDomain(
    record: typeof submissionReports.$inferSelect & {
      participantId?: string | null;
      userId?: string | null;
      userFirstName?: string | null;
      userLastName?: string | null;
      userHasAvatar?: boolean | null;
    },
  ): SubmissionReport {
    // Build reporter info if available
    let reporter: ReporterInfo | null = null;
    if (record.userId) {
      reporter = {
        reporterId: record.reporterId,
        participantId: record.participantId ?? "",
        userId: record.userId,
        firstName: record.userFirstName ?? "",
        lastName: record.userLastName ?? "",
        email: null,
        hasAvatar: record.userHasAvatar ?? false,
      };
    }

    return {
      id: record.id,
      submissionId: record.submissionId,
      reporterId: record.reporterId,
      reason: record.reason,
      details: record.details,
      createdAt: record.createdAt,
      reporter,
    } as unknown as SubmissionReport;
  }

  /**
   * Convert a domain SubmissionReport entity to Drizzle insert input
   */
  toDrizzleCreate(
    entity: SubmissionReport,
  ): Partial<typeof submissionReports.$inferInsert> {
    return {
      id: entity.id,
      submissionId: entity.submissionId,
      reporterId: entity.reporterId,
      reason: entity.reason,
      details: entity.details ?? null,
      createdAt: entity.createdAt,
    };
  }

  /**
   * Convert a domain SubmissionReport entity to Drizzle update input
   */
  toDrizzleUpdate(
    entity: SubmissionReport,
  ): Partial<typeof submissionReports.$inferInsert> {
    return {
      details: entity.details ?? null,
    };
  }

  /**
   * Create a partial entity from Drizzle record (for updates)
   */
  fromPartial(
    record: Partial<typeof submissionReports.$inferSelect>,
  ): Partial<SubmissionReport> {
    return {
      ...(record.id && { id: record.id }),
      ...(record.submissionId && { submissionId: record.submissionId }),
      ...(record.reporterId && { reporterId: record.reporterId }),
      ...(record.reason && { reason: record.reason }),
      ...(record.details !== undefined && { details: record.details }),
    };
  }

  static readonly instance = new SubmissionReportDrizzleMapper();
}
