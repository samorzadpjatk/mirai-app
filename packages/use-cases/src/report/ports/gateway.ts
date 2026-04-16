import type {
  ReportId,
  SubmissionId,
  Connection,
  DatabaseError,
} from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type { SubmissionReportDTO } from "../dto";

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

  /**
   * Find reports by submission ID with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findBySubmissionIdConnection(
    submissionId: SubmissionId,
    args: SubmissionReportConnectionArgs,
  ): Effect.Effect<Connection<SubmissionReportDTO>, DatabaseError, never>;

  /**
   * Find reports by reporter ID with cursor-based pagination
   */
  findByReporterIdConnection(
    reporterId: string,
    args: SubmissionReportConnectionArgs,
  ): Effect.Effect<Connection<SubmissionReportDTO>, DatabaseError, never>;

  /**
   * Find all reports with cursor-based pagination
   */
  findManyConnection(
    args: SubmissionReportConnectionArgs,
  ): Effect.Effect<Connection<SubmissionReportDTO>, DatabaseError, never>;
}

/**
 * SubmissionReportGateway Context.Tag for Effect dependency injection
 */
export class SubmissionReportGatewayTag extends Context.Tag(
  "SubmissionReportGateway",
)<SubmissionReportGatewayTag, SubmissionReportGateway>() {}
