import type { SubmissionReport } from "../entities/submission-report";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type { Connection } from "../../value-objects/pagination";

/**
 * Cursor data for submission report pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface SubmissionReportCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for submission report connection pagination
 */
export interface SubmissionReportConnectionArgs {
  first?: number;
  after?: SubmissionReportCursorData | null;
}

/**
 * SubmissionReportGateway Port
 *
 * Port interface for submission report persistence.
 * Implemented by adapters (e.g., DrizzleSubmissionReportGateway).
 */
export interface SubmissionReportGateway {
  /**
   * Create a new submission report
   */
  create(
    report: SubmissionReport,
  ): Effect.Effect<SubmissionReport, DatabaseError, never>;

  /**
   * Find a report by ID
   */
  findById(
    id: string,
  ): Effect.Effect<SubmissionReport | null, DatabaseError, never>;

  /**
   * Update a report
   */
  update(
    report: SubmissionReport,
  ): Effect.Effect<SubmissionReport, DatabaseError, never>;

  /**
   * Delete a report by ID
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if a report exists
   */
  exists(id: string): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Check if a user has already reported a submission
   */
  hasUserReported(
    submissionId: string,
    reporterId: string,
  ): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Find reports by submission ID with cursor-based pagination
   */
  findBySubmissionIdConnection(
    submissionId: string,
    args: SubmissionReportConnectionArgs,
  ): Effect.Effect<Connection<SubmissionReport>, DatabaseError, never>;

  /**
   * Find reports by reporter ID with cursor-based pagination
   */
  findByReporterIdConnection(
    reporterId: string,
    args: SubmissionReportConnectionArgs,
  ): Effect.Effect<Connection<SubmissionReport>, DatabaseError, never>;

  /**
   * Find reports with filters using cursor-based pagination
   */
  findManyConnection(
    args: SubmissionReportConnectionArgs,
  ): Effect.Effect<Connection<SubmissionReport>, DatabaseError, never>;
}
