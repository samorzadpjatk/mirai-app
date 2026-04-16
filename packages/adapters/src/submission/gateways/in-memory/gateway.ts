import type {
  SubmissionReportGateway,
  SubmissionReportDTO,
  ReportPaginatedResult,
} from "@mirai-app/use-cases";
import type { ReportId, SubmissionId } from "@mirai-app/domain";
import { Effect } from "effect";
import { InMemoryGateway } from "../../../system/shared/gateways/in-memory-base";

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

  findBySubmissionId(
    submissionId: SubmissionId,
  ): Effect.Effect<SubmissionReportDTO[], never, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((report) => report.submissionId === submissionId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findByReporterId(
    reporterId: string,
  ): Effect.Effect<SubmissionReportDTO[], never, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((report) => report.reporterId === reporterId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findByReason(
    reason: string,
  ): Effect.Effect<SubmissionReportDTO[], never, never> {
    const normalizedReason = reason.toUpperCase();
    return Effect.succeed(
      this.getAllItems()
        .filter((report) => report.reason.value === normalizedReason)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<ReportPaginatedResult, never, never> {
    const allItems = this.getAllItems().sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const total = allItems.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;

    let items = allItems;
    if (offset) {
      items = items.slice(offset);
    }
    if (limit !== undefined) {
      items = items.slice(0, limit);
    }

    // Calculate hasMore: if we got a full page and there are more items after
    const hasMore = items.length === limit && offset + items.length < total;

    return Effect.succeed({
      items,
      total,
      limit,
      offset,
      hasMore,
    });
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
}
