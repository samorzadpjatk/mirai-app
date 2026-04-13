import type { SubmissionReport, ReporterInfo } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../../gateways/base/repository";
import {
  submissionReports,
  type SubmissionReportSelect,
  type SubmissionReportInsert,
} from "@mirai-app/frameworks/drizzle/schema";

/**
 * SubmissionReportDrizzleMapper
 *
 * Maps between Drizzle database records and domain SubmissionReport entities.
 * Implements the DrizzleEntityMapper interface for standard repository operations.
 */
export class SubmissionReportDrizzleMapper implements DrizzleEntityMapper<
  SubmissionReport,
  SubmissionReportSelect,
  SubmissionReportInsert
> {
  /**
   * Convert a Drizzle SubmissionReport record to a domain entity
   */
  toDomain(
    record: SubmissionReportSelect & {
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
  toDrizzleInsert(entity: SubmissionReport): SubmissionReportInsert {
    return {
      id: entity.id as string,
      submissionId: entity.submissionId,
      reporterId: entity.reporterId,
      reason: entity.reason as unknown as string,
      details: entity.details ?? null,
      createdAt: (entity as any).createdAt ?? new Date(),
    };
  }

  /**
   * Convert a domain SubmissionReport entity to Drizzle update input
   */
  toDrizzleUpdate(entity: SubmissionReport): Partial<SubmissionReportInsert> {
    return {
      details: entity.details ?? null,
    };
  }

  /**
   * Create a partial entity from Drizzle record (for updates)
   */
  fromPartial(
    record: Partial<SubmissionReportSelect>,
  ): Partial<SubmissionReport> {
    const partial: Record<string, unknown> = {};
    if (record.id) partial.id = record.id;
    if (record.submissionId) partial.submissionId = record.submissionId;
    if (record.reporterId) partial.reporterId = record.reporterId;
    if (record.reason) partial.reason = record.reason;
    if (record.details !== undefined) partial.details = record.details;
    return partial as Partial<SubmissionReport>;
  }

  static readonly instance = new SubmissionReportDrizzleMapper();
}
