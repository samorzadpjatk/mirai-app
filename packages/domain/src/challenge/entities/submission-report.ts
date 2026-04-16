import { Effect } from "effect";
import { ValidationError } from "../../system/errors";
import type { ReportId } from "../value-objects/report-id";
import { ReportReason } from "../value-objects/report-reason";

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
  }): Effect.Effect<SubmissionReport, ValidationError, never> {
    return Effect.gen(function* () {
      // Validate submissionId
      if (!props.submissionId || props.submissionId.trim() === "") {
        return yield* Effect.fail(
          new ValidationError({
            message: "submissionId is required",
            field: "general",
          }),
        );
      }

      // Validate reporterId
      if (!props.reporterId || props.reporterId.trim() === "") {
        return yield* Effect.fail(
          new ValidationError({
            message: "reporterId is required",
            field: "general",
          }),
        );
      }

      // Validate and create reason
      const reasonResult = yield* ReportReason.create(props.reason);

      // Validate details (optional, but must not be empty if provided)
      let details: string | null = null;
      if (props.details !== undefined && props.details !== null) {
        const trimmed = props.details.trim();
        if (trimmed.length > 0) {
          if (trimmed.length > 2000) {
            return yield* Effect.fail(
              new ValidationError({
                message: "details must be at most 2000 characters",
                field: "general",
              }),
            );
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

      return new SubmissionReport(
        id,
        props.submissionId.trim(),
        props.reporterId.trim(),
        reasonResult,
        details,
        props.createdAt ?? new Date(),
        props.reporter ?? null,
      );
    });
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
