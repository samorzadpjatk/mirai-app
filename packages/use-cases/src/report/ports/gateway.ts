import type { ReportId, SubmissionId } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type { PaginationOptions } from "../../system/shared/dto";
import type { SubmissionReportDTO, ReportPaginatedResult } from "../dto";
import type { DatabaseError } from "./errors";

/**
 * SubmissionReportGateway Port
 *
 * This interface defines what operations the application needs
 * from any submission report gateway implementation.
 *
 * All methods return DTOs instead of domain entities.
 *
 * Implementations (in adapters layer):
 * - DrizzleSubmissionReportGateway: Uses Drizzle ORM
 * - InMemorySubmissionReportGateway: For testing
 */
export interface SubmissionReportGateway {
  /**
   * Create a new submission report
   */
  create(
    report: SubmissionReportDTO,
  ): Effect.Effect<SubmissionReportDTO, DatabaseError, never>;

  /**
   * Find report by ID
   * @returns SubmissionReportDTO or null if not found
   */
  findById(
    id: ReportId,
  ): Effect.Effect<SubmissionReportDTO | null, DatabaseError, never>;

  /**
   * Find all reports for a submission
   */
  findBySubmissionId(
    submissionId: SubmissionId,
  ): Effect.Effect<SubmissionReportDTO[], DatabaseError, never>;

  /**
   * Find all reports filed by a reporter
   */
  findByReporterId(
    reporterId: string,
  ): Effect.Effect<SubmissionReportDTO[], DatabaseError, never>;

  /**
   * Find reports by reason
   */
  findByReason(
    reason: string,
  ): Effect.Effect<SubmissionReportDTO[], DatabaseError, never>;

  /**
   * Find reports with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<ReportPaginatedResult, DatabaseError, never>;

  /**
   * Count reports for a submission
   */
  countBySubmissionId(
    submissionId: SubmissionId,
  ): Effect.Effect<number, DatabaseError, never>;

  /**
   * Check if a reporter has already reported a submission
   */
  existsBySubmissionAndReporter(
    submissionId: SubmissionId,
    reporterId: string,
  ): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Delete a report
   */
  delete(id: ReportId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if report exists
   */
  exists(id: ReportId): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Update report status
   */
  updateStatus(
    id: ReportId,
    status: string,
    reviewedById: string,
  ): Effect.Effect<SubmissionReportDTO, DatabaseError, never>;
}

/**
 * SubmissionReportGateway Context.Tag for Effect dependency injection
 */
export class SubmissionReportGatewayTag extends Context.Tag(
  "SubmissionReportGateway",
)<SubmissionReportGatewayTag, SubmissionReportGateway>() {}
