import type { SubmissionReport } from "@mirai-app/domain";
import { Context, Effect } from "effect";

/**
 * SubmissionReportRepository Port
 *
 * This interface defines what operations the application needs
 * from any submission report repository implementation.
 */
export interface SubmissionReportRepository {
  /**
   * Create a new submission report
   */
  create(
    report: SubmissionReport,
  ): Effect.Effect<SubmissionReport, never, never>;

  /**
   * Find report by ID
   * @returns Report or null if not found
   */
  findById(id: string): Effect.Effect<SubmissionReport | null, never, never>;

  /**
   * Find all reports for a submission
   */
  findBySubmissionId(
    submissionId: string,
  ): Effect.Effect<SubmissionReport[], never, never>;

  /**
   * Find all reports filed by a reporter
   */
  findByReporterId(
    reporterId: string,
  ): Effect.Effect<SubmissionReport[], never, never>;

  /**
   * Find reports by reason
   */
  findByReason(reason: string): Effect.Effect<SubmissionReport[], never, never>;

  /**
   * Find reports with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<SubmissionReport[], never, never>;

  /**
   * Count reports for a submission
   */
  countBySubmissionId(
    submissionId: string,
  ): Effect.Effect<number, never, never>;

  /**
   * Check if a reporter has already reported a submission
   */
  existsBySubmissionAndReporter(
    submissionId: string,
    reporterId: string,
  ): Effect.Effect<boolean, never, never>;

  /**
   * Delete a report
   */
  delete(id: string): Effect.Effect<void, never, never>;

  /**
   * Check if report exists
   */
  exists(id: string): Effect.Effect<boolean, never, never>;
}

/**
 * SubmissionReportRepository Context.Tag for Effect dependency injection
 */
export class SubmissionReportRepositoryTag extends Context.Tag(
  "SubmissionReportRepository",
)<
  SubmissionReportRepositoryTag,
  {
    create: (
      report: SubmissionReport,
    ) => Effect.Effect<SubmissionReport, never, never>;
    findById: (
      id: string,
    ) => Effect.Effect<SubmissionReport | null, never, never>;
    findBySubmissionId: (
      submissionId: string,
    ) => Effect.Effect<SubmissionReport[], never, never>;
    findByReporterId: (
      reporterId: string,
    ) => Effect.Effect<SubmissionReport[], never, never>;
    findByReason: (
      reason: string,
    ) => Effect.Effect<SubmissionReport[], never, never>;
    findAll: (options?: {
      limit?: number;
      offset?: number;
    }) => Effect.Effect<SubmissionReport[], never, never>;
    countBySubmissionId: (
      submissionId: string,
    ) => Effect.Effect<number, never, never>;
    existsBySubmissionAndReporter: (
      submissionId: string,
      reporterId: string,
    ) => Effect.Effect<boolean, never, never>;
    delete: (id: string) => Effect.Effect<void, never, never>;
    exists: (id: string) => Effect.Effect<boolean, never, never>;
  }
>() {}
