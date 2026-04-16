import type { SubmissionReport } from "../entities/submission-report";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";

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
   * Find reports by submission ID
   */
  findBySubmissionId(
    submissionId: string,
  ): Effect.Effect<SubmissionReport[], DatabaseError, never>;

  /**
   * Find reports by reporter user ID
   */
  findByReporterId(
    reporterId: string,
  ): Effect.Effect<SubmissionReport[], DatabaseError, never>;

  /**
   * Find all reports with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<SubmissionReport[], DatabaseError, never>;

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
}
