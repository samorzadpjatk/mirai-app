import { SubmissionReport, ReporterInfo } from "@mirai-app/domain";
import { ReportId } from "@mirai-app/domain";
import { ReportReason } from "@mirai-app/domain";

/**
 * SubmissionReportMapper
 *
 * Maps between Prisma database records and domain SubmissionReport entities.
 */
export class SubmissionReportMapper {
  /**
   * Convert a Prisma SubmissionReport record to a domain SubmissionReport entity
   */
  static toDomain(record: {
    id: string;
    submissionId: string;
    reporterId: string;
    reason: string;
    details: string | null;
    createdAt: Date;
    reporter?: {
      id: string;
      user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        authUserId: string | null;
        hasAvatar: boolean;
      } | null;
    } | null;
  }): SubmissionReport {
    // Build reporter info if available
    let reporter: ReporterInfo | null = null;
    if (record.reporter?.user) {
      reporter = {
        reporterId: record.reporterId,
        participantId: record.reporter.id,
        userId: record.reporter.user.id,
        firstName: record.reporter.user.firstName ?? "",
        lastName: record.reporter.user.lastName ?? "",
        email: null, // Will be populated separately via auth lookup
        hasAvatar: record.reporter.user.hasAvatar,
      };
    }

    const result = SubmissionReport.create({
      id: ReportId.unsafeCreate(record.id),
      submissionId: record.submissionId,
      reporterId: record.reporterId,
      reason: record.reason,
      details: record.details,
      createdAt: record.createdAt,
      reporter,
    });

    if (result.kind === "err") {
      throw new Error(
        `Failed to map SubmissionReport from database: ${result.error}`,
      );
    }

    return result.value;
  }

  /**
   * Convert a domain SubmissionReport entity to Prisma create input
   */
  static toPrismaCreate(report: SubmissionReport): {
    id: string;
    submissionId: string;
    reporterId: string;
    reason: string;
    details: string | null;
    createdAt: Date;
  } {
    return {
      id: report.id,
      submissionId: report.submissionId,
      reporterId: report.reporterId,
      reason: report.reason.value,
      details: report.details,
      createdAt: report.createdAt,
    };
  }

  /**
   * Convert a domain SubmissionReport entity to Prisma update input
   * Note: SubmissionReports are immutable, update is not typically used
   */
  static toPrismaUpdate(report: SubmissionReport): {
    details: string | null;
  } {
    return {
      details: report.details,
    };
  }
}
