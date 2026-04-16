import type {
  SubmissionReportGateway,
  SubmissionReportDTO,
  SubmissionReportConnectionArgs,
} from "@mirai-app/use-cases";
import type { ReportId, SubmissionId, Connection } from "@mirai-app/domain";
import { Effect } from "effect";
import { InMemoryGateway } from "../../../system/shared/gateways/in-memory-base";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";

/**
 * In-Memory Submission Report Gateway for Testing
 *
 * Implements SubmissionReportGateway port with in-memory storage.
 * Returns SubmissionReportDTOs instead of domain entities.
 * Useful for unit testing use cases without database dependencies.
 *
 * @example
 * ```typescript
 * const gateway = new InMemorySubmissionReportGateway();
 * gateway.seed([mockReportDTO]);
 *
 * const found = await Effect.runPromise(gateway.findById("report-123" as ReportId));
 * expect(found).not.toBeNull();
 *
 * const reports = await Effect.runPromise(gateway.findBySubmissionId("submission-456" as SubmissionId));
 * expect(reports).toHaveLength(1);
 *
 * gateway.reset(); // Clean up for next test
 * ```
 */
export class InMemorySubmissionReportGateway
  extends InMemoryGateway<SubmissionReportDTO>
  implements SubmissionReportGateway
{
  create(
    report: SubmissionReportDTO,
  ): Effect.Effect<SubmissionReportDTO, never, never> {
    return Effect.sync(() => {
      this.storage.set(report.id, report);
      return report;
    });
  }

  findById(
    id: ReportId,
  ): Effect.Effect<SubmissionReportDTO | null, never, never> {
    return Effect.sync(() => this.storage.get(id) ?? null);
  }

  countBySubmissionId(
    submissionId: SubmissionId,
  ): Effect.Effect<number, never, never> {
    return Effect.succeed(
      this.getAllItems().filter(
        (report) => report.submissionId === submissionId,
      ).length,
    );
  }

  existsBySubmissionAndReporter(
    submissionId: SubmissionId,
    reporterId: string,
  ): Effect.Effect<boolean, never, never> {
    return Effect.succeed(
      this.getAllItems().some(
        (report) =>
          report.submissionId === submissionId &&
          report.reporterId === reporterId,
      ),
    );
  }

  delete(id: ReportId): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.storage.delete(id);
    });
  }

  exists(id: ReportId): Effect.Effect<boolean, never, never> {
    return Effect.sync(() => this.storage.has(id));
  }

  updateStatus(
    id: ReportId,
    status: string,
    reviewedById: string,
  ): Effect.Effect<SubmissionReportDTO, never, never> {
    return Effect.sync(() => {
      const existing = this.storage.get(id);
      if (!existing) {
        throw new Error(`Report with id ${id} not found`);
      }

      const updated: SubmissionReportDTO = {
        ...existing,
        status,
        reviewedById,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      };

      this.storage.set(id, updated);
      return updated;
    });
  }

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find reports by submission ID with cursor-based pagination
   */
  findBySubmissionIdConnection(
    submissionId: SubmissionId,
    args: SubmissionReportConnectionArgs,
  ): Effect.Effect<Connection<SubmissionReportDTO>, never, never> {
    return this.executeConnectionQuery(
      submissionId,
      args,
      (report) => report.submissionId === submissionId,
    );
  }

  /**
   * Find reports by reporter ID with cursor-based pagination
   */
  findByReporterIdConnection(
    reporterId: string,
    args: SubmissionReportConnectionArgs,
  ): Effect.Effect<Connection<SubmissionReportDTO>, never, never> {
    return this.executeConnectionQuery(
      reporterId,
      args,
      (report) => report.reporterId === reporterId,
    );
  }

  /**
   * Find reports by reason with cursor-based pagination
   */
  findByReasonConnection(
    reason: string,
    args: SubmissionReportConnectionArgs,
  ): Effect.Effect<Connection<SubmissionReportDTO>, never, never> {
    const normalizedReason = reason.toUpperCase();
    return this.executeConnectionQuery(
      reason,
      args,
      (report) => report.reason.value === normalizedReason,
    );
  }

  /**
   * Find all reports with cursor-based pagination
   */
  findManyConnection(
    args: SubmissionReportConnectionArgs,
  ): Effect.Effect<Connection<SubmissionReportDTO>, never, never> {
    return this.executeConnectionQuery("all", args, () => true);
  }

  /**
   * Internal helper to execute cursor-based pagination queries
   * Sorts by createdAt, then id, then slices
   */
  private executeConnectionQuery(
    filterValue: string,
    args: SubmissionReportConnectionArgs,
    filterFn: (report: SubmissionReportDTO) => boolean,
  ): Effect.Effect<Connection<SubmissionReportDTO>, never, never> {
    return Effect.sync(() => {
      const first = Math.min(args.first ?? 20, 100);
      const cursor = args.after;

      // Get all reports matching the filter
      let reports = this.getAllItems().filter(filterFn);

      // Sort by createdAt ascending, then by id as tiebreaker
      reports.sort((a, b) => {
        const timeCompare = a.createdAt.getTime() - b.createdAt.getTime();
        if (timeCompare !== 0) return timeCompare;
        return a.id.localeCompare(b.id);
      });

      // Find starting position if cursor provided
      let startIndex = 0;
      if (cursor) {
        const cursorDate = new Date(cursor.createdAt);
        startIndex = reports.findIndex(
          (r) =>
            r.createdAt > cursorDate ||
            (r.createdAt.getTime() === cursorDate.getTime() &&
              r.id > cursor.id),
        );
        if (startIndex === -1) {
          startIndex = reports.length;
        }
      }

      // Slice to get the page
      const items = reports.slice(startIndex, startIndex + first);
      const hasMore = startIndex + first < reports.length;

      // Build edges with cursors
      const edges = items.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          createdAt: item.createdAt.toISOString(),
        }),
      }));

      return {
        edges,
        nodes: items,
        pageInfo: {
          hasNextPage: hasMore,
          hasPreviousPage: !!cursor,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
      };
    });
  }
}
