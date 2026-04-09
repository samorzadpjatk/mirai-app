import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";
import type { ReportId } from "../value-objects/ReportId";
import { ReportReason } from "../value-objects/ReportReason";

/**
 * ReporterInfo - Value object containing reporter information
 */
export interface ReporterInfo {
  reporterId: string;
  participantId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  hasAvatar: boolean;
}

/**
 * SubmissionReport entity - represents a user report on a challenge submission
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class SubmissionReport {
  private constructor(
    public readonly id: ReportId,
    public readonly submissionId: string,
    public readonly reporterId: string,
    public readonly reason: ReportReason,
    public readonly details: string | null,
    public readonly createdAt: Date,
    public readonly reporter: ReporterInfo | null,
  ) {}

  /**
   * Factory method to create a new SubmissionReport
   * Validates all input data
   */
  static create(props: {
    id?: ReportId;
    submissionId: string;
    reporterId: string;
    reason: string;
    details?: string | null;
    createdAt?: Date;
    reporter?: ReporterInfo | null;
  }): Result<SubmissionReport, string> {
    // Validate submissionId
    if (!props.submissionId || props.submissionId.trim() === "") {
      return err("submissionId is required");
    }

    // Validate reporterId
    if (!props.reporterId || props.reporterId.trim() === "") {
      return err("reporterId is required");
    }

    // Validate and create reason
    const reasonResult = ReportReason.create(props.reason);
    if (reasonResult.kind === "err") {
      return err(`Invalid reason: ${reasonResult.error}`);
    }

    // Validate details (optional, but must not be empty if provided)
    let details: string | null = null;
    if (props.details !== undefined && props.details !== null) {
      const trimmed = props.details.trim();
      if (trimmed.length > 0) {
        if (trimmed.length > 2000) {
          return err("details must be at most 2000 characters");
        }
        details = trimmed;
      }
    }

    // Generate or use provided ID
    let id: ReportId;
    if (props.id) {
      id = props.id;
    } else {
      id = crypto.randomUUID() as ReportId;
    }

    return ok(
      new SubmissionReport(
        id,
        props.submissionId.trim(),
        props.reporterId.trim(),
        reasonResult.value,
        details,
        props.createdAt ?? new Date(),
        props.reporter ?? null,
      ),
    );
  }

  /**
   * Check if this report is for a specific submission
   */
  isForSubmission(submissionId: string): boolean {
    return this.submissionId === submissionId;
  }

  /**
   * Check if this report was filed by a specific reporter
   */
  isFiledBy(reporterId: string): boolean {
    return this.reporterId === reporterId;
  }

  /**
   * Check if this report has additional details
   */
  hasDetails(): boolean {
    return this.details !== null && this.details.length > 0;
  }

  /**
   * Check if this report has reporter info attached
   */
  hasReporterInfo(): boolean {
    return this.reporter !== null;
  }

  /**
   * Get display text for the report reason
   */
  getReasonDisplay(): string {
    return this.reason.getDisplayText();
  }

  /**
   * Check if this report matches a specific reason
   */
  matchesReason(reason: string): boolean {
    return this.reason.value === reason.toUpperCase();
  }

  /**
   * Create a copy of this report with reporter info attached
   */
  withReporterInfo(reporter: ReporterInfo): SubmissionReport {
    return new SubmissionReport(
      this.id,
      this.submissionId,
      this.reporterId,
      this.reason,
      this.details,
      this.createdAt,
      reporter,
    );
  }

  /**
   * Create a copy of this report with updated email (for lazy loading)
   */
  withReporterEmail(email: string | null): SubmissionReport {
    if (!this.reporter) {
      return this;
    }

    return new SubmissionReport(
      this.id,
      this.submissionId,
      this.reporterId,
      this.reason,
      this.details,
      this.createdAt,
      {
        ...this.reporter,
        email: email,
      },
    );
  }
}

/**
 * Calculate report statistics from a collection of reports
 */
export function calculateReportStatistics(reports: SubmissionReport[]): {
  totalCount: number;
  byReason: Record<string, number>;
  uniqueSubmitters: number;
  reportsWithDetails: number;
} {
  const byReason: Record<string, number> = {};
  const submitterIds = new Set<string>();
  let reportsWithDetails = 0;

  for (const report of reports) {
    // Count by reason
    const reasonKey = report.reason.value;
    byReason[reasonKey] = (byReason[reasonKey] ?? 0) + 1;

    // Track unique submitters
    submitterIds.add(report.reporterId);

    // Count reports with details
    if (report.hasDetails()) {
      reportsWithDetails++;
    }
  }

  return {
    totalCount: reports.length,
    byReason,
    uniqueSubmitters: submitterIds.size,
    reportsWithDetails,
  };
}

/**
 * Group reports by submission ID
 */
export function groupReportsBySubmission(
  reports: SubmissionReport[],
): Map<string, SubmissionReport[]> {
  const grouped = new Map<string, SubmissionReport[]>();

  for (const report of reports) {
    const existing = grouped.get(report.submissionId) ?? [];
    existing.push(report);
    grouped.set(report.submissionId, existing);
  }

  return grouped;
}
